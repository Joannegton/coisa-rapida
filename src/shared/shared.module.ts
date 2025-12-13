import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditoriaModel } from './infra/models/auditoria.model';
import { AuditoriaRepository } from './infra/repositories/auditoria.repository';
import { AuditoriaCleanupJob } from './infra/jobs/auditoria-cleanup.job';
import { AuditoriaAdminController } from './controllers/auditoria-admin.controller';
import { sharedServices } from './services';

@Module({
    imports: [
        TypeOrmModule.forFeature([AuditoriaModel]),
        ScheduleModule.forRoot(),
    ],
    controllers: [AuditoriaAdminController],
    providers: [AuditoriaRepository, ...sharedServices, AuditoriaCleanupJob],
    exports: [...sharedServices],
})
export class SharedModule {}
