import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { OrmConfig } from './config/orm/ormConfig';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard, LimitadorUsuarioGuard } from './common/guards';
import { LoggerMiddleware, RateLimitMiddleware } from './common/middlewares';
import { AuditoriaInterceptor } from './common/auditoria.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { AuthController } from './modules/auth/auth.controller';
import { UsuarioController } from './modules/usuario/presentation/usuario.controller';
import { SharedModule } from './shared/shared.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({ ...OrmConfig }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        SharedModule,
        AuthModule,
        UsuarioModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditoriaInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: LimitadorUsuarioGuard,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware, RateLimitMiddleware)
            .forRoutes(AuthController, UsuarioController);
    }
}
