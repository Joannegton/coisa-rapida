import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from 'src/shared/infra/services/email.service';
import { TemplateService } from 'src/shared/infra/services/template.service';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { EmailVerificationUtils } from 'src/shared/utils/email-verification.utils';

@Injectable()
export class AuthEmailService {
    private readonly logger = new Logger(AuthEmailService.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly templateService: TemplateService,
        private readonly nestJwtService: NestJwtService,
    ) {}

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
}
