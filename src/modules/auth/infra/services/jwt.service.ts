import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService, JwtSignOptions } from '@nestjs/jwt';

export interface UsuarioPayload {
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
    ): Promise<{ token: string; expiresIn: number }> {
        const payload: UsuarioPayload = {
            sub: usuarioId,
            email,
            role,
        };

        const token = this.sign(payload, {
            expiresIn: Number(process.env.JWT_SECRET_EXPIRES_IN),
        });
        const expiresInSeconds = Number(process.env.JWT_SECRET_EXPIRES_IN);

        return { token, expiresIn: expiresInSeconds };
    }

    sign(payload: UsuarioPayload, options?: JwtSignOptions): string {
        return this.nestJwtService.sign(payload, options);
    }

    async gerarRefreshToken(
        payload: UsuarioPayload,
        diasValidade: number = 7,
    ): Promise<string> {
        return this.nestJwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: `${diasValidade}d`,
        });
    }

    async validarRefreshToken(token: string): Promise<UsuarioPayload> {
        return this.nestJwtService.verify(token, {
            secret: process.env.JWT_REFRESH_SECRET,
            ignoreExpiration: true,
        });
    }
}
