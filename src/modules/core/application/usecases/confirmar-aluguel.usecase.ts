import {
    BadRequestException,
    Inject,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import type { AssinaturaService } from '../../domain/services/assinatura.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils, Utils } from 'src/shared/utils';
import { Request } from 'express';
import { AssinarContratoDto } from '../dtos/assinar-contrato.dto';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

type ConfirmarAluguelUseCaseProps = AssinarContratoDto & {
    aluguelId: string;
    usuarioId: string;
    request: Request;
};

/**
 * Padrão SAGA COREOGRAFADA - Microsserviços
 *
 * Usa Bull Queues + Compensação Automática para garantir consistência eventual.
 *
 * Fluxo:
 * 1. Buscar aluguel
 * 2. Confirmar (regra de negócio)
 * 3. Salvar aluguel confirmado no banco
 * 4. Enfileirar job 'confirmar-aluguel' na fila Bull
 * 5. Se enfileiramento falhar → Compensação imediata (volta para SOLICITADO)
 * 6. Processor bloqueia datas do item via saga coreografada
 * 7. Se bloqueio falhar definitivamente → Compensação direta no @OnQueueFailed
 */
export class ConfirmarAluguelUseCase {
    private readonly logger = new Logger(ConfirmarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('AssinaturaService')
        private readonly assinaturaService: AssinaturaService,
        @InjectQueue('aluguel')
        private readonly aluguelQueue: Queue,
        private readonly auditoriaFilaService: AuditoriaFilaService,
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

        await this.aluguelRepository.salvar(aluguel);

        try {
            await this.aluguelQueue.add('confirmar-aluguel', {
                aluguelId: props.aluguelId,
                itemId: aluguel.itemId,
                dataInicio: aluguel.dataInicio.toISOString(),
                dataFim: aluguel.dataFim.toISOString(),
                locadorId: aluguel.locador.id,
                locatarioId: aluguel.locatario.id,
                usuarioId: props.usuarioId,
            });

            this.logger.log(
                `✅ Job enfileirado: confirmar-aluguel-${props.aluguelId}`,
            );
        } catch (queueError: any) {
            this.logger.error(
                `🚨 FALHA CRÍTICA: Não foi possível enfileirar job para aluguel ${props.aluguelId}`,
                queueError,
            );

            try {
                aluguel.voltarParaSolicitado();
                await this.aluguelRepository.salvar(aluguel);

                this.logger.warn(
                    `🔄 [COMPENSAÇÃO] Aluguel ${props.aluguelId} revertido para SOLICITADO devido a falha na fila`,
                );

                await this.auditoriaFilaService.agendarAuditoria({
                    timestamp: DataUtils.agoraDate(),
                    usuarioId: 'sistema',
                    acao: AuditoriaAcao.COMPENSACAO_EXECUTADA,
                    recurso: 'aluguel',
                    recursoId: props.aluguelId,
                    descricao: `Compensação automática: Aluguel revertido para SOLICITADO devido a falha na fila de processamento`,
                    nivel: 'critico',
                    ip: enderecoIp,
                    userAgent: userAgent,
                    erro: queueError.message,
                    estadoAntes: {
                        status: 'confirmado',
                        itemBloqueado: false,
                    },
                    estadoDepois: {
                        status: 'solicitado',
                        itemBloqueado: false,
                        compensacaoMotivo: 'falha_fila_processamento',
                    },
                });

                throw new BadRequestException(
                    `Confirmação de aluguel falhou devido a problema técnico. Tente novamente.`,
                );
            } catch (compensacaoError: any) {
                this.logger.error(
                    `🚨 ERRO CRÍTICO: Falha na compensação do aluguel ${props.aluguelId}`,
                    compensacaoError,
                );

                // 📝 Auditoria da falha crítica
                try {
                    await this.auditoriaFilaService.agendarAuditoria({
                        timestamp: DataUtils.agoraDate(),
                        usuarioId: 'sistema',
                        acao: AuditoriaAcao.COMPENSACAO_FALHA,
                        recurso: 'aluguel',
                        recursoId: props.aluguelId,
                        descricao: `FALHA CRÍTICA: Não foi possível compensar aluguel após falha na fila`,
                        nivel: 'critico',
                        ip: enderecoIp,
                        userAgent: userAgent,
                        erro: `Fila: ${queueError.message} | Compensação: ${compensacaoError.message}`,
                        estadoAntes: {
                            status: 'confirmado',
                        },
                        estadoDepois: {
                            status: 'estado_desconhecido',
                        },
                    });
                } catch (auditError) {
                    this.logger.error(
                        `Erro ao auditar falha crítica: ${auditError.message}`,
                    );
                }

                // 🚨 Relançar erro original
                throw queueError;
            }
        }

        // Auditorias com try-catch separado (não quebra a operação principal)
        try {
            await Promise.all([
                this.auditoriaFilaService.agendarAuditoria({
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
                this.auditoriaFilaService.agendarAuditoria({
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
        } catch (error) {
            this.logger.warn(
                `⚠️ Falha ao agendar auditoria para aluguel ${props.aluguelId} (aluguel já confirmado): ${error.message}`,
                error.stack,
            );
            // Não relança o erro - o aluguel foi confirmado com sucesso
            // A auditoria será processada pela fila ou irá para Dead Letter Queue
        }
    }
}
