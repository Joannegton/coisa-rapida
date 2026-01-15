import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaInterceptor } from './common/auditoria.interceptor';
import {
    JwtAuthGuard,
    LimitadorUsuarioGuard,
    RolesGuard,
} from './common/guards';
import { HttpExceptionFilter } from './common/http-exception.filter';

export const AppProviders = [
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
        provide: APP_GUARD,
        useClass: RolesGuard,
    },
    {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
    },
];
