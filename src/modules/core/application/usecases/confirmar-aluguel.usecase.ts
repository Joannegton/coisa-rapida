import {
    BadRequestException,
    Inject,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import { OutboxEvent } from '../../domain/outbox-event';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work';
import type { AssinaturaService } from '../../domain/services/assinatura.service';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils, Utils } from 'src/shared/utils';
import { DeadLetterQueueService } from 'src/shared/infra/services/dead-letter-queue.service';
import { Request } from 'express';
import { AssinarContratoDto } from '../dtos/assinar-contrato.dto';

type ConfirmarAluguelUseCaseProps = AssinarContratoDto & {
    aluguelId: string;
    usuarioId: string;
    request: Request;
};

/**
 * Padrão SAGA COREOGRAFADA - Microsserviços
 *
 * Usa Unit of Work + Outbox Pattern para garantir atomicidade.
 * O UseCase NÃO conhece detalhes de infraestrutura (DataSource, EntityManager).
 *
 * Fluxo:
 * 1. Buscar aluguel
 * 2. Confirmar (regra de negócio)
 * 3. UnitOfWork: Salvar aluguel + evento na outbox (mesma transação)
 * 4. Worker assíncrono publica evento
 * 5. Microsserviço Item bloqueia datas
 * 6. Se bloqueio falhar → CompensarAluguelHandler
 */
export class ConfirmarAluguelUseCase {
    private readonly logger = new Logger(ConfirmarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('UnitOfWork')
        private readonly unitOfWork: UnitOfWork,
        @Inject('AssinaturaService')
        private readonly assinaturaService: AssinaturaService,
        private readonly auditoriaService: AuditoriaService,
        private readonly deadLetterfilaService: DeadLetterQueueService,
    ) {}

    async execute(props: ConfirmarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        const ip = Utils.obterIpCliente(props.request);
        const enderecoIp = Utils.normalizarIp(ip);
        const userAgent = props.request.headers['user-agent'] || '';

        const assinaturaDigital = this.assinaturaService.gerarAssinaturaDigital(
            {
                aluguelId: props.aluguelId,
                usuarioId: props.usuarioId,
                usuarioTipo: 'locador',
                enderecoIp: enderecoIp,
                userAgent: userAgent,
                dataHora: DataUtils.agoraDate(),
            },
        );

        aluguel.confirmar({
            assinaturaDigital: assinaturaDigital,
            enderecoIp: enderecoIp,
            userAgent: userAgent,
            usuarioId: props.usuarioId,
            latitude: props.latitude,
            longitude: props.longitude,
        });

        const evento = new AluguelConfirmadoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
            aluguel.locador.id,
            aluguel.locatario.id,
        );

        try {
            await this.unitOfWork.executarEmTransacao(async (context) => {
                await context.salvarAluguel(aluguel);

                const outboxEvent = OutboxEvent.criar({
                    tipoEvento: evento.eventType,
                    idAgregado: evento.aggregateId,
                    tipoAgregado: 'Aluguel',
                    payload: {
                        eventId: evento.eventId,
                        aluguelId: evento.aluguelId,
                        itemId: evento.itemId,
                        dataInicio: evento.dataInicio.toISOString(),
                        dataFim: evento.dataFim.toISOString(),
                        locadorId: evento.locadorId,
                        locatarioId: evento.locatarioId,
                        occurredOn: evento.occurredOn.toISOString(),
                    },
                });

                await context.salvarEvento(outboxEvent);
            });

            const resultadosAuditoria = await Promise.allSettled([
                this.auditoriaService.criar({
                    timestamp: DataUtils.agoraDate(),
                    usuarioId: props.usuarioId,
                    acao: AuditoriaAcao.CONFIRMAR_ALUGUEL,
                    recurso: 'aluguel',
                    recursoId: props.aluguelId,
                    descricao: `Confirmação de aluguel pelo locador`,
                    nivel: 'alto',
                    ip: enderecoIp,
                    userAgent: userAgent,
                    estadoAntes: {
                        status: aluguel.status,
                        confirmado: false,
                    },
                    estadoDepois: {
                        status: 'confirmado',
                        confirmado: true,
                        assinaturaDigitalHash:
                            assinaturaDigital.substring(0, 20) + '...',
                    },
                }),
                this.auditoriaService.criar({
                    timestamp: DataUtils.agoraDate(),
                    usuarioId: props.usuarioId,
                    acao: AuditoriaAcao.ASSINAR_CONTRATO,
                    recurso: 'contrato',
                    recursoId: props.aluguelId,
                    descricao: `Assinatura digital de contrato de aluguel - Locador`,
                    nivel: 'critico',
                    ip: enderecoIp,
                    userAgent: userAgent,
                    estadoAntes: {
                        contratoAssinado: aluguel.contrato.estaAssinado()
                            ? 'parcialmente'
                            : 'nao_assinado',
                    },
                    estadoDepois: {
                        contratoAssinado: aluguel.contrato.estaAssinado()
                            ? 'totalmente'
                            : 'parcialmente',
                        assinaturaDigitalHash:
                            assinaturaDigital.substring(0, 20) + '...',
                        latitude: props.latitude,
                        longitude: props.longitude,
                    },
                }),
            ]);

            resultadosAuditoria.forEach((resultado, index) => {
                if (resultado.status === 'rejected') {
                    this.logger.error(
                        `❌ Falha na auditoria ${index + 1} para aluguel ${props.aluguelId}: ${resultado.reason.message}`,
                    );

                    this.deadLetterfilaService
                        .enviar({
                            modulo: 'core',
                            recurso: 'auditoria',
                            recursoId: props.aluguelId,
                            evento: {
                                tipo:
                                    index === 0
                                        ? AuditoriaAcao.CONFIRMAR_ALUGUEL
                                        : AuditoriaAcao.ASSINAR_CONTRATO,
                                aluguelId: props.aluguelId,
                                usuarioId: props.usuarioId,
                                enderecoIp: enderecoIp,
                                userAgent: userAgent,
                            },
                            erro: resultado.reason.message,
                            rastreamentoErro: resultado.reason.stack,
                            tentativasRetorno: 0,
                            contexto: {
                                usuarioId: props.usuarioId,
                                metadados: {
                                    aluguelId: props.aluguelId,
                                    indexAuditoria: index,
                                },
                            },
                            idCorrelacao: `audit-${props.aluguelId}-${index}`,
                            prioridade: 'alta',
                        })
                        .catch((error) => {
                            this.logger.error(
                                `❌ Falha ao enviar auditoria para fila: ${error.message}`,
                            );
                        });
                }
            });
        } catch (error) {
            this.logger.error(
                `❌ Falha ao confirmar aluguel ${props.aluguelId}: ${error.message}`,
            );

            throw new BadRequestException(
                'Não foi possível confirmar o aluguel. Tente novamente.',
            );
        }
    }
}
