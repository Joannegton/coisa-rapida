import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { OrmConfig } from './config/orm/ormConfig';
import { LoggerMiddleware, RateLimitMiddleware } from './common/middlewares';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { AuthController } from './modules/auth/auth.controller';
import { UsuarioController } from './modules/usuario/presentation/usuario.controller';
import { SharedModule } from './shared/shared.module';
import { AppProviders } from './app.providers';

@Module({
    imports: [
        TypeOrmModule.forRoot({ ...OrmConfig }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ScheduleModule.forRoot(),
        SharedModule,
        AuthModule,
        UsuarioModule,
    ],
    controllers: [],
    providers: [...AppProviders],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware, RateLimitMiddleware)
            .forRoutes(AuthController, UsuarioController);
    }
}
