import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenRepository } from 'src/modules/auth/infra/repositories/refresh-token.repository';
import { JwtService } from '../../infra/services/jwt.service';

@Injectable()
export class RefreshTokenUsecase {
    constructor(
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly jwtService: JwtService,
    ) {}

    async execute(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }> {
        const tokenRecord =
            await this.refreshTokenRepository.buscarPorToken(refreshToken);

        if (!tokenRecord) {
            throw new UnauthorizedException('Refresh token não encontrado');
        }

        if (tokenRecord.revogado) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        if (tokenRecord.expiraEm < new Date()) {
            throw new UnauthorizedException('Refresh token expirado');
        }

        const payload = await this.jwtService.validarRefreshToken(refreshToken);

        if (payload.sub !== tokenRecord.usuarioAuth.usuario.id) {
            throw new UnauthorizedException(
                'Refresh token não pertence ao usuário',
            );
        }

        const { token: accessToken, expiresIn } =
            await this.jwtService.gerarAccessToken(
                tokenRecord.usuarioAuth.usuario.id,
                tokenRecord.usuarioAuth.email,
                tokenRecord.usuarioAuth.role,
            );

        return {
            accessToken,
            expiresIn,
        };
    }
}
