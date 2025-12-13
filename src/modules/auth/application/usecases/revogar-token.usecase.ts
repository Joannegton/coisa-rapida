import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from '../../infra/repositories/refresh-token.repository';

@Injectable()
export class RevogarTokenUsecase {
    constructor(
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    async execute(token: string): Promise<void> {
        await this.refreshTokenRepository.revogarPorToken(token);
    }
}
