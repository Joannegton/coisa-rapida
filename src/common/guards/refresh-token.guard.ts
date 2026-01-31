import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader?.startsWith('Bearer ')) {
            request.refreshToken = authHeader.split(' ')[1];
            return super.canActivate(context);
        }

        if (request.cookies?.refresh_token) {
            request.refreshToken = request.cookies.refresh_token;
            request.headers.authorization = `Bearer ${request.cookies.refresh_token}`;
            return super.canActivate(context);
        }

        throw new UnauthorizedException(
            'Refresh token não fornecido. Use Authorization: Bearer <token> ou cookie refresh_token',
        );
    }

    handleRequest(err: any, user: any) {
        if (err || !user) {
            throw (
                err ||
                new UnauthorizedException('Refresh token inválido ou expirado')
            );
        }
        return user;
    }
}
