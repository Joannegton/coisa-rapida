import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioModel } from './infra/models/usuario.model';
import { UsuarioMapper } from './infra/mappers/usuario.mapper';
import { UsuarioController } from './presentation/usuario.controller';
import { ComprovanteResidenciaModel } from './infra/models/comprovante-residencia.model';
import { AuthModule } from '../auth/auth.module';
import { UsuarioRepositoryImpl } from './infra/repositories/usuario.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioModel, ComprovanteResidenciaModel]),
        AuthModule,
    ],
    controllers: [UsuarioController],
    providers: [
        UsuarioMapper,
        {
            provide: 'UsuarioRepository',
            useClass: UsuarioRepositoryImpl,
        },
    ],
    exports: ['UsuarioRepository', UsuarioMapper, AuthModule],
})
export class UsuarioModule {}
