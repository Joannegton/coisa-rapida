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

        // Extrai e valida o token
        const request = context.switchToHttp().getRequest();
        const token = this.extrairToken(request);

        if (!token) {
            throw new UnauthorizedException(
                'Token não fornecido. Envie via Authorization: Bearer <token>',
            );
        }

        request.token = token;

        return super.canActivate(context);
    }

    /**
     * Extrai o token priorizando Authorization Header.
     * Fallback para query param (útil para WebSockets/downloads de arquivos).
     *
     * Ordem de prioridade:
     * 1. Authorization: Bearer <token>
     * 2. Query param: ?token=<token>
     */
    private extrairToken(request: any): string | null {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        const queryToken = request.query?.token;
        if (queryToken && typeof queryToken === 'string') {
            return queryToken;
        }

        return null;
    }

    tratarRequisicao(err: any, user: any, info: any) {
        if (err || !user) {
            throw (
                err || new UnauthorizedException('Token inválido ou expirado')
            );
        }
        return user;
    }
}
