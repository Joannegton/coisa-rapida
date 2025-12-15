import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bull';
import { AuditoriaModel } from './infra/models/auditoria.model';
import { AuditoriaRepository } from './infra/repositories/auditoria.repository';
import { AuditoriaCleanupJob } from './infra/jobs/auditoria-cleanup.job';
import { AuditoriaAdminController } from './controllers/auditoria-admin.controller';
import { sharedServices } from './infra/services';
import { EmailProcessor } from './infra/services/email.processor';

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
        TypeOrmModule.forFeature([AuditoriaModel]),
        ScheduleModule.forRoot(),
        CqrsModule.forRoot(),
    ],
    controllers: [AuditoriaAdminController],
    providers: [AuditoriaRepository, ...sharedServices, AuditoriaCleanupJob, EmailProcessor],
    exports: [...sharedServices],
})
export class SharedModule {}
