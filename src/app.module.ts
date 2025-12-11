import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SegurancaModule } from './modules/seguranca/seguranca.module';
import { FirebaseModule } from './config/firebase.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrmConfig } from './config/ormConfig';
import { TesteModule } from './modules/teste/teste.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard, LimitadorUsuarioGuard } from './common/guards';
import { LoggerMiddleware, RateLimitMiddleware } from './common/middlewares';
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
    imports: [
        TypeOrmModule.forRoot({ ...OrmConfig }),
        // SegurancaModule,
        // FirebaseModule,
        // TesteModule,
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
        consumer.apply(LoggerMiddleware, RateLimitMiddleware).forRoutes('*');
    }
}
