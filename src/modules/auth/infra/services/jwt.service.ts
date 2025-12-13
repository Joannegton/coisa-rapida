import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';

export interface JwtPayload {
    sub: string;
    email: string;
    role: 'USER' | 'MODERADOR' | 'ADMIN';
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtService {
    constructor(private readonly nestJwtService: NestJwtService) {}

    async gerarAccessToken(
        usuarioId: string,
        email: string,
        role: 'USER' | 'MODERADOR' | 'ADMIN' = 'USER',
    ): Promise<string> {
        const payload: JwtPayload = {
            sub: usuarioId,
            email,
            role,
        };

        return this.sign(payload, { expiresIn: '15m' });
    }

    sign(payload: JwtPayload, options?: JwtSignOptions): string {
        return this.nestJwtService.sign(payload, options);
    }

    async gerarRefreshToken(
        payload: JwtPayload,
        diasValidade: number = 7,
    ): Promise<string> {
        return this.nestJwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: `${diasValidade}d`,
        });
    }

    async validarRefreshToken(token: string): Promise<JwtPayload> {
        return this.nestJwtService.verify(token, {
            secret: process.env.JWT_REFRESH_SECRET,
            ignoreExpiration: true,
        });
    }
}
