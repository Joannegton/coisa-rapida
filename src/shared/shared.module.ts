import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaModel } from './infra/models/auditoria.model';
import { AuditoriaRepository } from './infra/repositories/auditoria.repository';
import { AuditoriaService } from './services/auditoria.service';
import { CacheService } from './services/cache.service';

@Module({
    imports: [TypeOrmModule.forFeature([AuditoriaModel])],
    providers: [AuditoriaRepository, AuditoriaService, CacheService],
    exports: [AuditoriaService, CacheService],
})
export class SharedModule {}
