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
import { ComprovanteResidenciaMapper } from './infra/mappers/ComprovanteResidencia.mapper';
import { ComprovanteResidenciaRepositoryImpl } from './infra/repositories/comprovante-residencia.repository';
import { EnderecoMapper } from './infra/mappers/Endereco.mapper';
import { CloudinaryService } from 'src/shared/services/Cloudinary.service';
import { VirusTotalService } from 'src/shared/services/VirusTotal.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioModel, ComprovanteResidenciaModel]),
        SharedModule,
    ],
    controllers: [UsuarioController, VerificacaoController],
    providers: [
        ...usuarioUsecases,
        TwilioService,
        CloudinaryService,
        VirusTotalService,
        UsuarioMapper,
        EnderecoMapper,
        ComprovanteResidenciaMapper,
        {
            provide: 'UsuarioRepository',
            useClass: UsuarioRepositoryImpl,
        },
        {
            provide: 'ComprovanteResidenciaRepository',
            useClass: ComprovanteResidenciaRepositoryImpl,
        },
    ],
    exports: [],
})
export class UsuarioModule {}
