import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthRepository } from '../infra/repositories/auth.repository';
import type { UsuarioPayload } from '../infra/services/jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authRepository: AuthRepository) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: UsuarioPayload): Promise<UsuarioPayload> {
        const usuarioAuth = await this.authRepository.buscarPorEmail(
            payload.email,
        );
        if (!usuarioAuth) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
