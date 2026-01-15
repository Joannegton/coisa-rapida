import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
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
import { CloudinaryService } from 'src/shared/infra/services/Cloudinary.service';
import { VirusTotalService } from 'src/shared/infra/services/VirusTotal.service';
import { UsuarioEmailServiceImpl } from './infra/services/email.service';
import { EmailVerificadoHandler } from './application/email-verificado.handler';

@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioModel, ComprovanteResidenciaModel]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: Number(process.env.JWT_SECRET_EXPIRES_IN),
            },
        }),
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
        EmailVerificadoHandler,
        {
            provide: 'UsuarioEmailService',
            useClass: UsuarioEmailServiceImpl,
        },
        {
            provide: 'UsuarioRepository',
            useClass: UsuarioRepositoryImpl,
        },
        {
            provide: 'ComprovanteResidenciaRepository',
            useClass: ComprovanteResidenciaRepositoryImpl,
        },
    ],
    exports: ['UsuarioRepository'],
})
export class UsuarioModule {}
