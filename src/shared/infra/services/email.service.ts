import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

    async enviarEmail(options: {
        para: string;
        assunto: string;
        htmlBody: string;
    }): Promise<void> {
        try {
            const job = await this.emailQueue.add(
                'enviar-email',
                {
                    to: options.para,
                    subject: options.assunto,
                    htmlBody: options.htmlBody,
                },
                {
                    jobId: `email-${options.para}-${Date.now()}`,
                    priority: 10, // Alta prioridade para emails críticos
                },
            );

            this.logger.log(
                `📧 Email adicionado à fila para ${options.para}. Job ID: ${job.id}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao adicionar email à fila para ${options.para}:`,
                error.message,
            );
            throw new Error(`Falha ao enfileirar email: ${error.message}`);
        }
    }
}
