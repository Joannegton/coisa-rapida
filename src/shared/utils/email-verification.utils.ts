import { JwtService as NestJwtService } from '@nestjs/jwt';

export class EmailVerificationUtils {
    private static readonly TOKEN_EXPIRY = 1 * 60 * 60; // 1 hora

    static generateVerificationToken(
        jwtService: NestJwtService,
        usuarioId: string,
        email: string,
        secret: string,
    ): string {
        const payload = { sub: usuarioId, email, type: 'email_verification' };
        return jwtService.sign(payload, {
            expiresIn: this.TOKEN_EXPIRY,
            secret,
        });
    }

    static generateVerificationUrl(baseUrl: string, token: string): string {
        return `${baseUrl}/api/v1/verificacao/email/verificar?token=${token}`;
    }
}
