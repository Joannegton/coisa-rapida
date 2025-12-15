import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EmailVerificadoEvent } from 'src/modules/usuario/domain/events/email-verificado.events';
import type { UsuarioEmailService } from 'src/modules/usuario/domain/services';

@EventsHandler(EmailVerificadoEvent)
@Injectable()
export class EmailVerificadoHandler
    implements IEventHandler<EmailVerificadoEvent>
{
    private readonly logger = new Logger(EmailVerificadoHandler.name);

    // Ex: NotificationService, CrmService, AnalyticsService
    constructor(
        @Inject('UsuarioEmailService')
        private readonly emailService: UsuarioEmailService,
    ) {}

    async handle(event: EmailVerificadoEvent): Promise<void> {
        this.logger.log(
            `🎯 Processando evento: ${event.eventType} | ` +
                `Usuário: ${event.usuarioId} | ` +
                `Email: ${event.email} | ` +
                `EventID: ${event.eventId}`,
        );

        try {
            await this.emailService.enviarEmailBoasVindas(event.email);
            // TODO: Implementar lógica de negócio pós-verificação
            // Exemplos:
            // - Atualizar status no CRM
            // - Registrar evento no analytics
            // - Disparar workflow de onboarding
            // - Integrar com sistemas externos

            this.logger.log(
                `✅ Evento EmailVerificado processado com sucesso para ${event.email}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao processar EmailVerificado: ${error.message}`,
                {
                    eventId: event.eventId,
                    usuarioId: event.usuarioId,
                    error: error.stack,
                },
            );

            // Não relançar erro para não bloquear outros handlers
            // Em produção, enviar para DLQ ou sistema de alertas
        }
    }
}
