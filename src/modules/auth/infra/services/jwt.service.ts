import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

export interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtService {
    constructor(private readonly nestJwtService: NestJwtService) {}

    async gerarAccessToken(usuarioId: string, email: string): Promise<string> {
        const payload: JwtPayload = {
            sub: usuarioId,
            email,
        };

        return this.nestJwtService.sign(payload, {
            expiresIn: '24h',
        });
    }

    async gerarRefreshToken(usuarioId: string, email: string): Promise<string> {
        const payload: JwtPayload = {
            sub: usuarioId,
            email,
        };

        return this.nestJwtService.sign(payload, {
            expiresIn: '7d',
        });
    }

    async validarToken(token: string): Promise<JwtPayload> {
        return this.nestJwtService.verify(token);
    }
}
