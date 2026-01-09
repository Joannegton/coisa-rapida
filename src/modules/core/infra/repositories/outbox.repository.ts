import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
    OutboxEventModel,
    StatusOutboxEvent,
} from '../models/outbox-event.model';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class OutboxRepository {
    private readonly logger = new Logger(OutboxRepository.name);

    constructor(
        @InjectRepository(OutboxEventModel)
        private readonly repository: Repository<OutboxEventModel>,
        private readonly auditoriaService: AuditoriaService,
    ) {}
    async buscarPorId(props: {
        eventoId: string;
        pendentes: boolean;
    }): Promise<OutboxEventModel | null> {
        return await this.repository.findOne({
            where: {
                id: props.eventoId,
                status: props.pendentes
                    ? StatusOutboxEvent.PENDENTE
                    : undefined,
            },
        });
    }

    async marcarComoPublicado(eventId: string): Promise<void> {
        await this.repository.update(eventId, {
            status: StatusOutboxEvent.PUBLICADO,
            publicadoEm: new Date(),
        });
    }

    /**
     * Registra falha na publicação (para retry)
     */
    async registrarFalha(eventId: string, mensagemErro: string): Promise<void> {
        const event = await this.repository.findOne({
            where: { id: eventId },
        });

        if (!event) return;

        const quantidadeTentativas = event.quantidadeTentativas + 1;
        const limiteTentativas = 5;

        // Após 5 tentativas, marca como FAILED definitivamente
        if (quantidadeTentativas >= limiteTentativas) {
            await this.repository.update(eventId, {
                status: StatusOutboxEvent.FALHADO,
                quantidadeTentativas,
                mensagemErro: `[${quantidadeTentativas}x] ${mensagemErro}`,
            });
            this.logger.error(
                `Evento ${eventId} falhou após ${limiteTentativas} tentativas`,
            );

            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: 'core',
                acao: AuditoriaAcao.EVENTO_FALHA_DEFINITIVA,
                recurso: 'OutboxEvent',
                recursoId: eventId,
                descricao: `Evento ${event.tipoEvento} falhou após ${limiteTentativas} tentativas. Agregado: ${event.tipoAgregado}#${event.idAgregado}`,
                nivel: 'critico',
                erro: mensagemErro,
                estadoAntes: {
                    status: 'PENDENTE',
                    quantidadeTentativas: event.quantidadeTentativas,
                },
                estadoDepois: {
                    status: 'FALHADO',
                    quantidadeTentativas,
                    mensagemErro: `[${quantidadeTentativas}x] ${mensagemErro}`,
                },
                mudancas: [
                    {
                        campo: 'status',
                        valorAntes: 'PENDENTE',
                        valorDepois: 'FALHADO',
                    },
                    {
                        campo: 'quantidadeTentativas',
                        valorAntes: event.quantidadeTentativas,
                        valorDepois: quantidadeTentativas,
                    },
                ],
                timestamp: new Date(),
            });
        } else {
            // Incrementa contador de retry, mantém PENDING
            await this.repository.update(eventId, {
                quantidadeTentativas,
                mensagemErro: `[${quantidadeTentativas}x] ${mensagemErro}`,
            });
        }
    }

    async limparEventosAntigos(diasAntigos = 15): Promise<number> {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasAntigos);

        const resultado = await this.repository.delete({
            status: StatusOutboxEvent.PUBLICADO,
            publicadoEm: LessThan(dataLimite),
        });

        const deletados = resultado.affected || 0;
        this.logger.log(
            `🧹 Limpeza: ${deletados} eventos publicados removidos (>${diasAntigos} dias)`,
        );

        return deletados;
    }
}
