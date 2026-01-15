import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuthEmailService } from '../../infra/services/auth-email.service';
import { UsuarioRegistradoEvent } from '../events/usuario-registrado';

@EventsHandler(UsuarioRegistradoEvent)
@Injectable()
export class UsuarioRegistradoHandler
    implements IEventHandler<UsuarioRegistradoEvent>
{
    private readonly logger = new Logger(UsuarioRegistradoHandler.name);

    constructor(private readonly emailService: AuthEmailService) {}

    async handle(event: UsuarioRegistradoEvent): Promise<void> {
        this.logger.log(
            `🎯 Processando evento: ${event.eventType} | ` +
                `Usuário: ${event.usuarioId} | ` +
                `Email: ${event.email} | ` +
                `EventID: ${event.eventId}`,
        );

        try {
            const verificationUrl = this.emailService.gerarUrlVerificacao(
                event.usuarioId,
                event.email,
            );

            await this.emailService.enviarLinkVerificacao(
                event.email,
                verificationUrl,
            );

            this.logger.log(
                `✅ Email de verificação enviado com sucesso para ${event.email}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao processar UsuarioRegistrado: ${error.message}`,
                {
                    eventId: event.eventId,
                    usuarioId: event.usuarioId,
                    error: error.stack,
                },
            );

            //TODO Em produção, considerar:
            // - Dead Letter Queue (DLQ)
            // - Retry automático
            // - Alertas para equipe de operações
        }
    }
}
