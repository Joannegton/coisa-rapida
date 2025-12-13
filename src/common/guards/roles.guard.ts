import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import type { JwtPayload } from '../../modules/auth/infra/services/jwt.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const metadatas = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!metadatas || metadatas.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: JwtPayload = request.user;

        if (!user) {
            throw new ForbiddenException('Usuário não autenticado');
        }

        const hasRole = metadatas.includes(user.role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Acesso negado. Roles necessárias: ${metadatas.join(', ')}`,
            );
        }

        return true;
    }
}
