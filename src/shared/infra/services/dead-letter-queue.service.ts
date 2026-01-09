import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { AuditoriaService } from './auditoria.service';
import { NotificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

export interface MensagemFilaMorta {
    id?: string; // Gerado automaticamente se não fornecido
    modulo: string;
    recurso: string;
    recursoId: string;
    evento: any; // Evento original que falhou
    erro: string;
    rastreamentoErro?: string;
    tentativasRetorno: number;
    contexto?: {
        estadoAntes?: any;
        estadoDepois?: any;
        usuarioId?: string;
        metadados?: Record<string, any>;
    };
    timestamp?: Date; // Preenchido automaticamente se não fornecido
    idCorrelacao?: string; // Para rastreamento distribuído
    prioridade?: 'baixa' | 'media' | 'alta';
}

/**
 * 🪦 Serviço de Fila Morta (Dead Letter Queue)
 *
 * Fila para mensagens que falharam criticamente e precisam
 * de intervenção manual para reprocessamento.
 *
 * Usa o CacheService (Redis) já existente para persistência.
 *
 * Funcionalidades:
 * - Armazenamento de mensagens falhidas
 * - Notificação automática para equipe
 * - Auditoria crítica
 * - Reprocessamento manual via dashboard
 */
@Injectable()
export class DeadLetterQueueService {
    private readonly logger = new Logger(DeadLetterQueueService.name);
    private readonly CHAVE_FILA = 'deadLetterQueue:mensagens';
    private readonly CHAVE_PROCESSADAS = 'deadLetterQueue:processadas';
    private readonly CHAVE_STATS = 'deadLetterQueue:stats';
    private readonly TTL_30_DIAS = 30 * 24 * 60 * 60;

    constructor(
        private readonly cacheService: CacheService,
        private readonly auditoriaService: AuditoriaService,
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Envia mensagem para Fila Morta
     */
    async enviar(mensagem: MensagemFilaMorta): Promise<string> {
        try {
            // Gera ID se não existir
            if (!mensagem.id) {
                mensagem.id = uuidv4();
            }

            // Define timestamp se não existir
            mensagem.timestamp ??= new Date();

            // Define prioridade padrão
            if (!mensagem.prioridade) {
                mensagem.prioridade = 'media';
            }

            this.logger.warn(
                `🪦 Enviando mensagem para Dead Letter Queue: ${mensagem.modulo}.${mensagem.recurso}#${mensagem.recursoId} [${mensagem.idCorrelacao}]`,
            );

            await this.salvarNaFila(mensagem);

            await this.atualizarEstatisticas(mensagem);

            await this.criarAuditoria(mensagem);

            // 4. Notifica equipe técnica
            await this.notificarEquipe(mensagem);

            this.logger.log(
                `✅ Mensagem ${mensagem.id} enviada para Dead Letter Queue com sucesso`,
            );

            return mensagem.id;
        } catch (error) {
            this.logger.error(
                `❌ Falha ao enviar mensagem para Dead Letter Queue: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Busca mensagens da Fila Morta (para dashboard/admin)
     */
    async obterMensagens(limite = 50): Promise<MensagemFilaMorta[]> {
        try {
            const mensagens = await this.cacheService.obter<
                MensagemFilaMorta[]
            >(this.CHAVE_FILA);
            return mensagens ? mensagens.slice(0, limite) : [];
        } catch (error) {
            this.logger.error(
                `Erro ao buscar mensagens da Dead Letter Queue: ${error.message}`,
            );
            return [];
        }
    }

    /**
     * Remove mensagem da Fila Morta (após reprocessamento manual)
     */
    async removerMensagem(idMensagem: string): Promise<boolean> {
        try {
            // Busca a mensagem
            const mensagens = await this.obterMensagens(1000);
            const indice = mensagens.findIndex((m) => m.id === idMensagem);

            if (indice === -1) {
                return false;
            }

            const mensagem = mensagens[indice];

            // Remove da fila ativa
            mensagens.splice(indice, 1);
            await this.cacheService.definir(
                this.CHAVE_FILA,
                mensagens,
                this.TTL_30_DIAS,
            );

            // Move para lista de processadas
            const processadas = await this.cacheService.obter<
                MensagemFilaMorta[]
            >(this.CHAVE_PROCESSADAS);
            const novasProcessadas = [
                ...(processadas || []),
                {
                    ...mensagem,
                    processadaEm: new Date(),
                },
            ];
            await this.cacheService.definir(
                this.CHAVE_PROCESSADAS,
                novasProcessadas,
                this.TTL_30_DIAS,
            );

            this.logger.log(
                `✅ Mensagem ${idMensagem} removida da Dead Letter Queue`,
            );

            // Auditoria
            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: mensagem.modulo,
                acao: 'FILA_MORTA_RESOLVIDA',
                recurso: mensagem.recurso,
                recursoId: mensagem.recursoId,
                descricao: `Mensagem removida da Dead Letter Queue: ${mensagem.erro}`,
                nivel: 'baixo',
                timestamp: new Date(),
            });

            return true;
        } catch (error) {
            this.logger.error(
                `Erro ao remover mensagem ${idMensagem} da Dead Letter Queue: ${error.message}`,
            );
            return false;
        }
    }

    /**
     * Reprocessa mensagem (retry manual)
     */
    async reprocessarMensagem(idMensagem: string): Promise<boolean> {
        try {
            const mensagens = await this.obterMensagens(1000);
            const mensagem = mensagens.find((m) => m.id === idMensagem);

            if (!mensagem) {
                this.logger.warn(`Mensagem ${idMensagem} não encontrada`);
                return false;
            }

            this.logger.log(`🔄 Reprocessando mensagem ${idMensagem}...`);

            // Incrementa tentativas de retorno
            mensagem.tentativasRetorno = (mensagem.tentativasRetorno || 0) + 1;

            // Aqui seria implementada a lógica específica de reprocessamento
            // Por exemplo: reenviar evento, refazer operação, etc.

            // Por enquanto, apenas marca como processada
            await this.removerMensagem(idMensagem);

            return true;
        } catch (error) {
            this.logger.error(
                `Erro ao reprocessar mensagem ${idMensagem}: ${error.message}`,
            );
            return false;
        }
    }

    /**
     * Estatísticas da Fila Morta
     */
    async obterEstatisticas(): Promise<{
        totalMensagens: number;
        mensagensProcessadas: number;
        mensagensPorModulo: Record<string, number>;
        mensagensPorPrioridade: Record<string, number>;
    }> {
        try {
            const mensagens = await this.obterMensagens(10000);
            const processadas = await this.cacheService.obter<
                MensagemFilaMorta[]
            >(this.CHAVE_PROCESSADAS);

            const porModulo: Record<string, number> = {};
            const porPrioridade: Record<string, number> = {};

            mensagens.forEach((msg) => {
                porModulo[msg.modulo] = (porModulo[msg.modulo] || 0) + 1;
                const prioridade = msg.prioridade || 'media';
                porPrioridade[prioridade] =
                    (porPrioridade[prioridade] || 0) + 1;
            });

            return {
                totalMensagens: mensagens.length,
                mensagensProcessadas: processadas?.length || 0,
                mensagensPorModulo: porModulo,
                mensagensPorPrioridade: porPrioridade,
            };
        } catch (error) {
            this.logger.error(
                `Erro ao obter estatísticas da Dead Letter Queue: ${error.message}`,
            );
            return {
                totalMensagens: 0,
                mensagensProcessadas: 0,
                mensagensPorModulo: {},
                mensagensPorPrioridade: {},
            };
        }
    }

    private async salvarNaFila(mensagem: MensagemFilaMorta): Promise<void> {
        const mensagens = await this.obterMensagens(10000);
        mensagens.unshift(mensagem); // Adiciona no início (LIFO)
        // TTL de 30 dias
        await this.cacheService.definir(
            this.CHAVE_FILA,
            mensagens,
            this.TTL_30_DIAS,
        );
    }

    private async atualizarEstatisticas(
        mensagem: MensagemFilaMorta,
    ): Promise<void> {
        try {
            const stats = await this.cacheService.obter<Record<string, string>>(
                this.CHAVE_STATS,
            );
            const novasStats = {
                ...stats,
                total: (
                    Number.parseInt(stats?.['total'] || '0') + 1
                ).toString(),
                [`modulo:${mensagem.modulo}`]: (
                    Number.parseInt(
                        stats?.[`modulo:${mensagem.modulo}`] || '0',
                    ) + 1
                ).toString(),
                [`prioridade:${mensagem.prioridade || 'media'}`]: (
                    Number.parseInt(
                        stats?.[
                            `prioridade:${mensagem.prioridade || 'media'}`
                        ] || '0',
                    ) + 1
                ).toString(),
                ultimaAtualizacao: new Date().toISOString(),
            };

            // TTL de 30 dias para limpeza automática
            await this.cacheService.definir(
                this.CHAVE_STATS,
                novasStats,
                this.TTL_30_DIAS,
            );
        } catch (error) {
            this.logger.warn(
                `Erro ao atualizar estatísticas: ${error.message}`,
            );
        }
    }

    private async criarAuditoria(mensagem: MensagemFilaMorta): Promise<void> {
        try {
            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: mensagem.modulo,
                acao: AuditoriaAcao.DDEAD_LETTER_QUEUE_ENVIADA,
                recurso: mensagem.recurso,
                recursoId: mensagem.recursoId,
                descricao: `Mensagem enviada para Dead Letter Queue: ${mensagem.erro}`,
                nivel: 'critico',
                erro: mensagem.erro,
                estadoAntes: mensagem.contexto?.estadoAntes,
                estadoDepois: { status: 'DEAD_LETTER_QUEUE' },
                timestamp: mensagem.timestamp!,
                mudancas: [
                    {
                        campo: 'status',
                        valorAntes: mensagem.contexto?.estadoAntes?.status,
                        valorDepois: 'DEAD_LETTER_QUEUE',
                    },
                ],
            });
        } catch (error) {
            this.logger.error(
                `Erro ao criar auditoria da Dead Letter Queue: ${error.message}`,
            );
        }
    }

    private async notificarEquipe(mensagem: MensagemFilaMorta): Promise<void> {
        try {
            await this.notificationService.enviarAlerta({
                titulo: '🚨 Dead Letter Queue - Falha Crítica',
                mensagem: `Falha crítica em ${mensagem.modulo}.${mensagem.recurso}`,
                detalhes: {
                    id: mensagem.id,
                    modulo: mensagem.modulo,
                    recurso: mensagem.recurso,
                    recursoId: mensagem.recursoId,
                    erro: mensagem.erro,
                    idCorrelacao: mensagem.idCorrelacao,
                    prioridade: mensagem.prioridade,
                    timestamp: mensagem.timestamp,
                },
                severidade: 'critica',
                canais: ['slack', 'email'], // Configurável
            });
        } catch (error) {
            this.logger.error(
                `Erro ao notificar equipe sobre Dead Letter Queue: ${error.message}`,
            );
        }
    }
}
