import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
import { ServiceException } from 'src/common/exceptions/service.exception';

export type VerificarSMSResult = {
    status?: string;
    valid: boolean;
};

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private readonly client: twilio.Twilio;
    private readonly verifySid: string;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
        const authToken = process.env.TWILIO_AUTH_TOKEN as string;
        this.verifySid = process.env.TWILIO_VERIFY_SERVICE_SID as string;

        this.client = twilio(accountSid, authToken);
    }

    async enviarCodigoVerificacao(telefone: string): Promise<void> {
        try {
            await this.client.verify.v2
                .services(this.verifySid)
                .verifications.create({
                    to: telefone,
                    channel: 'sms',
                    locale: 'pt-BR',
                });
        } catch (error) {
            this.logger.error('Erro ao enviar SMS via Twilio:', error);

            // Erro 60200: numero invalido
            if (error.code === 60200) {
                throw new ServiceException(
                    'Número de telefone inválido ou não suportado',
                );
            }

            throw new ServiceException('Erro ao enviar SMS');
        }
    }

    async verificarCodigo(
        telefone: string,
        codigo: string,
    ): Promise<VerificarSMSResult> {
        try {
            const verificationCheck = await this.client.verify.v2
                .services(this.verifySid)
                .verificationChecks.create({
                    to: telefone,
                    code: codigo,
                });

            const isValid = verificationCheck.status === 'approved';

            return {
                status: verificationCheck.status,
                valid: isValid,
            };
        } catch (error) {
            this.logger.error('Erro ao verificar código SMS:', error);

            // Se o código estiver errado, o Twilio retorna status 404
            if (error.status === 404 || error.code === 20404) {
                throw new ServiceException('Código de verificação inválido');
            }

            throw new ServiceException(
                `Erro ao verificar código: ${error.message || 'Erro desconhecido'}`,
            );
        }
    }

    formatarTelefoneParaInternacional(telefone: string): string {
        const numeroLimpo = telefone.replaceAll(/\D/g, '');

        // Valida se é um telefone brasileiro válido (10 ou 11 dígitos)
        if (!/^\d{10,11}$/.test(numeroLimpo)) {
            throw new Error(
                'Telefone inválido. Use formato com DDD (10 ou 11 dígitos)',
            );
        }

        return `+55${numeroLimpo}`;
    }
}
