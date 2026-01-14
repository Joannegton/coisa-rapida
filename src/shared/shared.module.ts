import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bull';
import { AuditoriaModel } from './infra/models/auditoria.model';
import { AuditoriaRepository } from './infra/repositories/auditoria.repository';
import { AuditoriaCleanupJob } from './infra/jobs/auditoria-cleanup.job';
import { AuditoriaAdminController } from './controllers/auditoria-admin.controller';
import { ControladorAdminFilaMortaController } from './controllers/controlador-admin-fila-morta.controller';
import { sharedServices } from './infra/services';
import { EmailProcessor } from './infra/jobs/email.processor.worker';
import { VerificacaoVirusFilaService } from './infra/services/verificacao-virus.fila.service';
import { VerificacaoVirusProcessor } from './infra/jobs/verificacao-virus.processor.worker';
import { AuditoriaFilaProcessor } from './infra/jobs/auditoria.processor.worker';
import { PagamentoProcessor } from './infra/jobs/pagamento.processor.worker';

@Module({
    imports: [
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            },
        }),
        BullModule.registerQueue({
            name: 'email',
        }),
        BullModule.registerQueue({
            name: 'verificacao-virus',
        }),
        BullModule.registerQueue({
            name: 'auditoria',
        }),
        BullModule.registerQueue({
            name: 'pagamento',
        }),
        BullModule.registerQueue({
            name: 'aluguel',
        }),
        TypeOrmModule.forFeature([AuditoriaModel]),
        CqrsModule.forRoot(),
    ],
    controllers: [
        AuditoriaAdminController,
        ControladorAdminFilaMortaController,
    ],
    providers: [
        AuditoriaRepository,
        ...sharedServices,
        AuditoriaCleanupJob,
        EmailProcessor,
        VerificacaoVirusFilaService,
        VerificacaoVirusProcessor,
        AuditoriaFilaProcessor,
        PagamentoProcessor,
    ],
    exports: [...sharedServices],
})
export class SharedModule {}
