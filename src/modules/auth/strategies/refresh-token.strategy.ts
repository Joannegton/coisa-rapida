import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UsuarioPayload } from '../infra/services/jwt.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: process.env.JWT_REFRESH_SECRET,
        });
    }

    async validate(payload: UsuarioPayload) {
        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
