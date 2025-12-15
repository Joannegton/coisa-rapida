import { Injectable, Logger } from '@nestjs/common';
import {
    EmailVerificationToken,
    UsuarioEmailService,
} from '../../domain/services';
import { EmailService } from 'src/shared/infra/services/email.service';
import { TemplateService } from 'src/shared/infra/services/template.service';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ServiceException } from 'src/common/exceptions/service.exception';
import { EmailVerificationUtils } from 'src/shared/utils/email-verification.utils';

@Injectable()
export class UsuarioEmailServiceImpl implements UsuarioEmailService {
    private readonly logger = new Logger(UsuarioEmailServiceImpl.name);
    constructor(
        private readonly emailService: EmailService,
        private readonly templateService: TemplateService,
        private readonly nestJwtService: NestJwtService,
    ) {}

    async enviarLinkVerificacao(
        email: string,
        verificationUrl: string,
    ): Promise<void> {
        this.logger.debug(`Enviando link de verificação para ${email}`);

        try {
            const htmlBody = this.templateService.renderizar(
                'email-solicitar-verificacao',
                {
                    VERIFICATION_URL: verificationUrl,
                },
            );

            await this.emailService.enviarEmail({
                para: email,
                assunto: 'Verifique seu email - Coisa Rápida',
                htmlBody,
            });

            this.logger.debug(
                `Link de verificação enviado com sucesso para ${email}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao enviar link de verificação para ${email}: ${error.message}`,
            );
            throw error;
        }
    }

    async enviarEmailBoasVindas(email: string): Promise<void> {
        this.logger.debug(`Enviando email de boas-vindas para ${email}`);
        try {
            const htmlBody = this.templateService.renderizar(
                'email-boas-vindas',
                {
                    APP_URL: process.env.FRONTEND_URL || process.env.API_URL,
                },
            );

            await this.emailService.enviarEmail({
                para: email,
                assunto: 'Bem-vindo à Coisa Rápida!',
                htmlBody,
            });

            this.logger.debug(
                `Email de boas-vindas enviado com sucesso para ${email}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao enviar email de boas-vindas para ${email}: ${error.message}`,
            );
            throw error;
        }
    }

    gerarUrlVerificacao(
        usuarioId: string,
        email: string,
        baseUrl: string = process.env.API_URL as string,
    ): string {
        const token = this.gerarTokenVerificacao(usuarioId, email);
        return EmailVerificationUtils.generateVerificationUrl(baseUrl, token);
    }

    gerarTokenVerificacao(usuarioId: string, email: string): string {
        return EmailVerificationUtils.generateVerificationToken(
            this.nestJwtService,
            usuarioId,
            email,
            process.env.JWT_SECRET as string,
        );
    }

    validarTokenVerificacao(token: string): EmailVerificationToken {
        try {
            const payload = this.nestJwtService.verify<EmailVerificationToken>(
                token,
                {
                    secret: process.env.JWT_SECRET,
                },
            );

            if (payload.type !== 'email_verification') {
                throw new ServiceException('Token inválido');
            }

            return payload;
        } catch (error) {
            if (error instanceof ServiceException) {
                throw error;
            }
            this.logger.error(`Erro ao validar token: ${error.message}`);
            throw new ServiceException('Erro ao validar token');
        }
    }
}
