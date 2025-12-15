import { Injectable, Logger } from '@nestjs/common';
import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import * as nodemailer from 'nodemailer';

interface SendEmailJob {
    to: string;
    subject: string;
    htmlBody: string;
}

@Injectable()
@Processor('email')
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);
    private readonly transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    @Process('enviar-email')
    async handleSendEmail(job: Job<SendEmailJob>) {
        const { to, subject, htmlBody } = job.data;
        const maxAttempts = 3;

        this.logger.debug(
            `[Tentativa ${job.attemptsMade + 1}/${maxAttempts}] Enviando email para ${to}`,
        );

        try {
            const mailOptions = {
                from: `"Coisa Rápida" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlBody,
            };

            const result = await this.transporter.sendMail(mailOptions);

            this.logger.log(
                `✅ Email enviado com sucesso para ${to}. Message ID: ${result.messageId}`,
            );

            return {
                success: true,
                messageId: result.messageId,
            };
        } catch (error) {
            this.logger.error(
                `❌ Erro ao enviar email para ${to} (tentativa ${job.attemptsMade + 1}/${maxAttempts}):`,
                error.message,
            );

            throw error;
        }
    }

    @OnQueueFailed()
    async onEmailFailed(job: Job<SendEmailJob>, err: Error) {
        this.logger.error(
            `🚨 Email CRÍTICO falhou para ${job.data.to}: ${err.message}`,
        );

        // Aqui você poderia:
        // 1. Enviar notificação para Slack/admin
        // 2. Salvar em tabela de emails_pendentes
        // 3. Tentar reenvio manual (se fizer sentido)
    }
}
