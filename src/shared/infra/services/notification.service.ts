// src/shared/infra/services/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';

export interface MensagemAlerta {
    titulo: string;
    mensagem: string;
    detalhes?: any;
    severidade: 'baixa' | 'media' | 'alta' | 'critica';
    canais: ('slack' | 'email' | 'sms')[];
}

/**
 * 📢 Serviço de Notificações
 *
 * Serviço para envio de notificações/alertas para equipe técnica.
 * Em produção, integraria com Slack, Email, SMS, etc.
 */
@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    /**
     * Envia alerta para equipe
     */
    async enviarAlerta(alerta: MensagemAlerta): Promise<void> {
        try {
            this.logger.warn(
                `🚨 ALERTA ${alerta.severidade.toUpperCase()}: ${alerta.titulo}`,
            );
            this.logger.warn(`📝 ${alerta.mensagem}`);

            if (alerta.detalhes) {
                this.logger.warn(`📋 Detalhes:`, alerta.detalhes);
            }

            // TODO: Implementar integrações reais
            // - Slack webhook
            // - Email via SendGrid/Mailgun
            // - SMS via Twilio

            // Por enquanto, apenas log estruturado
            await this.registrarAlerta(alerta);
        } catch (error) {
            this.logger.error(`Erro ao enviar alerta: ${error.message}`);
        }
    }

    /**
     * Notificação de evento crítico (método legado)
     */
    async notificarEventoCritico(
        mensagem: string,
        contexto?: any,
    ): Promise<void> {
        await this.enviarAlerta({
            titulo: 'Evento Crítico',
            mensagem,
            detalhes: contexto,
            severidade: 'critica',
            canais: ['slack', 'email'],
        });
    }

    // ========== MÉTODOS PRIVADOS ==========

    private async registrarAlerta(alerta: MensagemAlerta): Promise<void> {
        // Em produção, isso seria enviado para sistema de monitoramento
        // como DataDog, New Relic, ou sistema próprio

        const entradaLog = {
            timestamp: new Date(),
            nivel: alerta.severidade,
            titulo: alerta.titulo,
            mensagem: alerta.mensagem,
            detalhes: alerta.detalhes,
            canais: alerta.canais,
        };

        // Salva em arquivo ou envia para serviço de logs
        this.logger.log(
            `📊 Alerta estruturado:`,
            JSON.stringify(entradaLog, null, 2),
        );
    }
}
