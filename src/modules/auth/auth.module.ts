import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { UsuarioAuthModel } from './infra/models/usuario-auth.model';
import { UsuarioModel } from '../usuario/infra/models/usuario.model';
import { AuthRepository } from './infra/repositories/auth.repository';
import { RefreshTokenRepository } from './infra/repositories/refresh-token.repository';
import { AuthController } from './auth.controller';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { RefreshTokenStrategy } from 'src/modules/auth/strategies/refresh-token.strategy';
import { SharedModule } from 'src/shared/shared.module';
import { RefreshTokenModel } from './infra/models/refresh-token.model';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { AUTH_USECASES } from './application/usecases';
import { AUTH_SERVICES } from './infra/services';
import { LimparRefreshTokenJob } from './infra/jobs/refresh-token-cleanup.job';
import { UsuarioRegistradoHandler } from './application/event-handlers/usuario-registrado.handler';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UsuarioAuthModel,
            UsuarioModel,
            RefreshTokenModel,
        ]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '15m' },
        }),
        CqrsModule,
        SharedModule,
    ],
    controllers: [AuthController],
    providers: [
        ...AUTH_USECASES,
        ...AUTH_SERVICES,
        LimparRefreshTokenJob,
        UsuarioRegistradoHandler,
        JwtStrategy,
        RefreshTokenStrategy,
        AuthRepository,
        RefreshTokenRepository,
        RefreshTokenGuard,
    ],
    exports: [],
})
export class AuthModule {}
