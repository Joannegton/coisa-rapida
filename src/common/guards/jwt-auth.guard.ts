import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { CHAVE_PUBLICA } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const ehPublico = this.reflector.getAllAndOverride<boolean>(
            CHAVE_PUBLICA,
            [context.getHandler(), context.getClass()],
        );

        if (ehPublico) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extrairToken(request);

        if (!token) {
            throw new UnauthorizedException(
                'Token não fornecido. Envie via Authorization: Bearer <token> ou cookie',
            );
        }

        request.token = token;

        return super.canActivate(context);
    }

    private extrairToken(request: any): string | null {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        if (request.cookies?.access_token) {
            request.headers.authorization = `Bearer ${request.cookies.access_token}`;
            return request.cookies.access_token;
        }

        const queryToken = request.query?.token;
        if (queryToken && typeof queryToken === 'string') {
            return queryToken;
        }

        return null;
    }
}
