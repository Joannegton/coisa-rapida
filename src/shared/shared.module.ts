import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditoriaModel } from './infra/models/auditoria.model';
import { AuditoriaRepository } from './infra/repositories/auditoria.repository';
import { AuditoriaService } from './services/auditoria.service';
import { CacheService } from './services/cache.service';
import { AuditoriaCleanupJob } from './infra/jobs/auditoria-cleanup.job';
import { AuditoriaAdminController } from './controllers/auditoria-admin.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([AuditoriaModel]),
        ScheduleModule.forRoot(),
    ],
    controllers: [AuditoriaAdminController],
    providers: [
        AuditoriaRepository,
        AuditoriaService,
        CacheService,
        AuditoriaCleanupJob,
    ],
    exports: [AuditoriaService, CacheService],
})
export class SharedModule {}
