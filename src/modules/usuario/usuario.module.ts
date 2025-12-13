import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioModel } from './infra/models/usuario.model';
import { UsuarioMapper } from './infra/mappers/usuario.mapper';
import { UsuarioController } from './presentation/usuario.controller';
import { ComprovanteResidenciaModel } from './infra/models/comprovante-residencia.model';
import { UsuarioRepositoryImpl } from './infra/repositories/usuario.repository';
import { usuarioUsecases } from './application/usecases';
import { VerificacaoController } from './presentation/verificacao.controller';
import { TwilioService } from './infra/services/Twilio.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioModel, ComprovanteResidenciaModel]),
        SharedModule,
    ],
    controllers: [UsuarioController, VerificacaoController],
    providers: [
        ...usuarioUsecases,
        TwilioService,
        UsuarioMapper,
        {
            provide: 'UsuarioRepository',
            useClass: UsuarioRepositoryImpl,
        },
    ],
    exports: [],
})
export class UsuarioModule {}
