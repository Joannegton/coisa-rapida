import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Cron } from '@nestjs/schedule';
import { Client } from 'pg';
import { OutboxRepository } from '../repositories/outbox.repository';
import { OutboxEvent } from '../../domain/outbox-event';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import { AluguelCanceladoEvent } from '../../domain/events/aluguel-cancelado.event';
import { AluguelFinalizadoEvent } from '../../domain/events/aluguel-finalizado.event';

// Melhorar padrão DDD

/**
 * 🔔 Outbox Publisher com LISTEN/NOTIFY (PostgreSQL)
 *
 * **Fluxo:**
 * 1. Trigger PostgreSQL notifica quando evento é inserido
 * 2. Listener recebe notificação em tempo real (~100ms)
 * 3. Publica evento no EventBus
 * 4. Se falhar: Log de erro para investigação manual
 *
 * @see docs/funcionamento-logica/SAGA_COREOGRAFADA.md
 */
@Injectable()
export class OutboxPublisherListener implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OutboxPublisherListener.name);
    private pgClient: Client;

    constructor(
        private readonly outboxRepository: OutboxRepository,
        private readonly eventBus: EventBus,
    ) {}

    /**
     * Inicializa listener do PostgreSQL ao carregar o módulo
     */
    async onModuleInit() {
        try {
            // Cria conexão dedicada para LISTEN
            this.pgClient = new Client({
                connectionString: process.env.DATABASE_URL as string,
            });

            await this.pgClient.connect();

            // Configura listener de notificações
            this.pgClient.on('notification', async (msg) => {
                if (msg.channel === 'outbox_events') {
                    const payload = JSON.parse(msg.payload);
                    this.logger.log(
                        `🔔 Notificação recebida: ${payload.tipo_evento} (${payload.id})`,
                    );
                    await this.publicarEvento(payload.id);
                }
            });

            // Registra listener no canal 'outbox_events'
            await this.pgClient.query('LISTEN outbox_events');

            this.logger.log(
                '✅ OutboxPublisherListener iniciado (PostgreSQL LISTEN/NOTIFY)',
            );
            this.logger.log('📊 Latência esperada: ~100-200ms');
        } catch (error) {
            this.logger.error(
                `❌ Erro ao iniciar LISTEN/NOTIFY: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Desconecta listener ao desligar o módulo
     */
    async onModuleDestroy() {
        if (this.pgClient) {
            await this.pgClient.query('UNLISTEN outbox_events');
            await this.pgClient.end();
            this.logger.log('👋 OutboxPublisherListener desconectado');
        }
    }

    /**
     * Publica um evento específico do outbox
     */
    private async publicarEvento(eventoId: string): Promise<void> {
        try {
            // Busca evento completo
            const eventos = await this.outboxRepository.buscarPendentes(1);
            const evento = eventos.find((e) => e.id === eventoId);

            if (!evento) {
                this.logger.warn(
                    `⚠️ Evento ${eventoId} não encontrado ou já processado`,
                );
                return;
            }

            // Reconstrói evento de domínio
            const eventoDominio = this.reconstruirEvento(evento);

            if (!eventoDominio) {
                this.logger.warn(
                    `⚠️ Tipo de evento desconhecido: ${evento.tipoEvento}`,
                );
                await this.outboxRepository.registrarFalha(
                    evento.id,
                    `Tipo de evento desconhecido: ${evento.tipoEvento}`,
                );
                return;
            }

            // Publica no EventBus
            await this.eventBus.publish(eventoDominio);

            // Marca como publicado
            await this.outboxRepository.marcarComoPublicado(evento.id);

            this.logger.log(
                `✅ Evento ${evento.tipoEvento} publicado em tempo real (${evento.id})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao publicar evento ${eventoId}: ${error.message}`,
            );
            await this.outboxRepository.registrarFalha(eventoId, error.message);
        }
    }

    /**
     * Limpa eventos antigos (executado diariamente às 3h)
     */
    @Cron('0 3 * * *')
    async limparEventosAntigos(): Promise<void> {
        try {
            await this.outboxRepository.limparEventosAntigos(30);
        } catch (error) {
            this.logger.error(
                `❌ Erro ao limpar eventos antigos: ${error.message}`,
            );
        }
    }

    /**
     * Reconstrói evento de domínio a partir do payload da outbox
     */
    private reconstruirEvento(
        outboxEvent: OutboxEvent,
    ):
        | AluguelConfirmadoEvent
        | AluguelCanceladoEvent
        | AluguelFinalizadoEvent
        | null {
        const payload = outboxEvent.payload;

        switch (outboxEvent.tipoEvento) {
            case 'AluguelConfirmado':
                return new AluguelConfirmadoEvent(
                    payload.aluguelId,
                    payload.itemId,
                    new Date(payload.dataInicio),
                    new Date(payload.dataFim),
                    payload.locadorId,
                    payload.locatarioId,
                );

            case 'AluguelCancelado':
                return new AluguelCanceladoEvent(
                    payload.aluguelId,
                    payload.itemId,
                    new Date(payload.dataInicio),
                    new Date(payload.dataFim),
                    payload.motivo,
                );

            case 'AluguelFinalizado':
                return new AluguelFinalizadoEvent(
                    payload.aluguelId,
                    payload.itemId,
                    new Date(payload.dataInicio),
                    new Date(payload.dataFim),
                );

            default:
                return null;
        }
    }
}
