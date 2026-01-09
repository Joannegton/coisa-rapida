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
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import { AluguelCanceladoEvent } from '../../domain/events/aluguel-cancelado.event';
import { AluguelFinalizadoEvent } from '../../domain/events/aluguel-finalizado.event';
import { OutboxEventModel } from '../models/outbox-event.model';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

//TODO Melhorar padrão DDD

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

    // Health check inteligente
    private isConnected = false;
    private lastHealthCheck = 0;
    private consecutiveFailures = 0;

    private readonly HEALTH_INTERVAL = 5 * 60 * 1000; // 5 minutos
    private readonly MAX_FAILURES = 3;
    private readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 segundos

    constructor(
        private readonly outboxRepository: OutboxRepository,
        private readonly auditoriaService: AuditoriaService,
        private readonly eventBus: EventBus,
    ) {}

    /**
     * Inicializa listener do PostgreSQL ao carregar o módulo
     */
    async onModuleInit() {
        try {
            await this.reiniciarConexao();
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
            try {
                await this.pgClient.query('UNLISTEN outbox_events');
                await this.pgClient.end();
                this.isConnected = false;
                this.logger.log('👋 OutboxPublisherListener desconectado');
            } catch (error) {
                this.logger.error(
                    `❌ Erro ao desconectar listener: ${error.message}`,
                );
            }
        }
    }

    /**
     * 🏥 Health Check Inteligente (executa a cada minuto, mas verifica apenas a cada 5 minutos)
     * Implementa circuit breaker após 3 falhas consecutivas
     */
    @Cron('*/1 * * * *')
    async healthCheckInteligente(): Promise<void> {
        const agora = Date.now();

        // Apenas verifica se intervalou 5 minutos E conexão está saudável
        if (
            this.isConnected &&
            agora - this.lastHealthCheck < this.HEALTH_INTERVAL
        ) {
            return;
        }

        await this.verificarConexao();
    }

    /**
     * 🔍 Verifica saúde da conexão PostgreSQL
     */
    private async verificarConexao(): Promise<void> {
        try {
            // Circuit breaker: pausa verificações por 30 minutos após 3 falhas
            if (this.consecutiveFailures >= this.MAX_FAILURES) {
                const agora = Date.now();
                const tempoBackoff = 30 * 60 * 1000; // 30 minutos
                const proximaVerificacao = this.lastHealthCheck + tempoBackoff;

                if (agora < proximaVerificacao) {
                    return; // Ainda em período de backoff
                }

                // Reseta contador e tenta novamente
                this.logger.log(
                    '🔄 Tentando reconectar após período de backoff (circuit breaker reset)',
                );
                this.consecutiveFailures = 0;
            }

            // Health check com timeout
            const promise = this.pgClient.query('SELECT 1 as health_check_ok');

            const timeout = new Promise((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                `Health check timeout (${this.HEALTH_CHECK_TIMEOUT}ms)`,
                            ),
                        ),
                    this.HEALTH_CHECK_TIMEOUT,
                ),
            );

            await Promise.race([promise, timeout]);

            // Sucesso
            if (!this.isConnected) {
                this.logger.log(
                    '🟢 LISTEN/NOTIFY reconectado com sucesso (recoveryto)',
                );
                this.consecutiveFailures = 0;
            }

            this.isConnected = true;
            this.lastHealthCheck = Date.now();
        } catch (error) {
            this.consecutiveFailures++;

            this.logger.warn(
                `🔴 Health check falhou (${this.consecutiveFailures}/${this.MAX_FAILURES}): ${error.message}`,
            );

            if (this.consecutiveFailures >= this.MAX_FAILURES) {
                this.logger.error(
                    `❌ Conexão perdida! Circuit breaker ativado por 30 minutos.`,
                );
                this.isConnected = false;

                await this.auditoriaService.criar({
                    usuarioId: 'sistema',
                    modulo: 'core',
                    acao: AuditoriaAcao.EVENTO_FALHA_PUBLICACAO,
                    recurso: 'OutboxPublisher',
                    recursoId: 'health-check',
                    descricao: `Conexão PostgreSQL LISTEN/NOTIFY perdida. Circuit breaker ativado.`,
                    nivel: 'critico',
                    erro: error.message,
                    estadoAntes: { status: 'CONECTADO' },
                    estadoDepois: { status: 'DESCONECTADO' },
                    timestamp: new Date(),
                });

                // Tenta reconectar em background
                this.reiniciarConexao().catch((err) => {
                    this.logger.error(`❌ Erro ao reconectar: ${err.message}`);
                });
            }
        }
    }

    /**
     * 🔗 Reinicia conexão PostgreSQL LISTEN/NOTIFY
     */
    private async reiniciarConexao(): Promise<void> {
        try {
            // Fecha conexão anterior se existir
            if (this.pgClient) {
                try {
                    await this.pgClient.end();
                } catch {
                    // Ignora erros ao fechar
                }
            }

            // Cria nova conexão
            this.pgClient = new Client({
                connectionString: process.env.DATABASE_URL as string,
            });

            await this.pgClient.connect();

            // Configura listener de notificações
            this.pgClient.on('notification', async (msg) => {
                if (msg.channel === 'outbox_events') {
                    try {
                        const payload = JSON.parse(msg.payload);
                        this.logger.log(
                            `🔔 Notificação recebida: ${payload.tipo_evento} (${payload.id})`,
                        );
                        await this.publicarEvento(payload.id);
                    } catch (error) {
                        this.logger.error(
                            `❌ Erro ao processar notificação: ${error.message}`,
                        );
                    }
                }
            });

            // Registra listener no canal 'outbox_events'
            await this.pgClient.query('LISTEN outbox_events');

            this.isConnected = true;
            this.consecutiveFailures = 0;
            this.lastHealthCheck = Date.now();

            this.logger.log('✅ Conexão PostgreSQL LISTEN/NOTIFY restaurada');
        } catch (error) {
            this.logger.error(`❌ Erro ao reiniciar conexão: ${error.message}`);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Publica um evento específico do outbox
     */
    private async publicarEvento(eventoId: string): Promise<void> {
        try {
            // Busca evento completo
            const evento = await this.outboxRepository.buscarPorId({
                eventoId,
                pendentes: true,
            });

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

            await this.eventBus.publish(eventoDominio);

            await this.outboxRepository.marcarComoPublicado(evento.id);

            this.logger.log(
                `✅ Evento ${evento.tipoEvento} publicado em tempo real (${evento.id})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao publicar evento ${eventoId}: ${error.message}`,
            );
            await this.outboxRepository.registrarFalha(eventoId, error.message);

            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: 'core',
                acao: AuditoriaAcao.EVENTO_FALHA_PUBLICACAO,
                recurso: 'OutboxEvent',
                recursoId: eventoId,
                descricao: `Falha ao publicar evento: ${error.message}`,
                nivel: 'alto',
                erro: error.message,
                estadoAntes: { status: 'PENDENTE' },
                estadoDepois: { status: 'FALHADO' },
                timestamp: new Date(),
            });
        }
    }

    /**
     * Reconstrói evento de domínio a partir do payload da outbox
     */
    private reconstruirEvento(
        outboxEvent: OutboxEventModel,
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
