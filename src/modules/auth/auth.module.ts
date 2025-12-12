import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsuarioAuthModel } from './infra/models/usuario-auth.model';
import { UsuarioModel } from '../usuario/infra/models/usuario.model';
import { AuthRepository } from './infra/repositories/auth.repository';
import { BcryptService } from './infra/services/bcrypt.service';
import { JwtService } from './infra/services/jwt.service';
import { RegistrarUsecase } from './application/usecases/registrar.usecase';
import { LoginUsecase } from './application/usecases/login.usecase';
import { AuthController } from './auth.controller';
import { JwtStrategy } from 'src/modules/auth/jwt.strategy';
import { UsuarioRepository } from '../usuario/infra/repositories/usuario.repository';
import { UsuarioMapper } from '../usuario/infra/mappers/usuario.mapper';
import { SharedModule } from 'src/shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UsuarioAuthModel, UsuarioModel]),
        JwtModule.register({
            secret:
                process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-123',
            signOptions: { expiresIn: '24h' },
        }),
        SharedModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthRepository,
        UsuarioRepository,
        BcryptService,
        JwtService,
        JwtStrategy,
        UsuarioMapper,
        RegistrarUsecase,
        LoginUsecase,
    ],
    exports: [BcryptService, JwtService, JwtStrategy],
})
export class AuthModule {}
