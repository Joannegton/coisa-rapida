import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class LimparRefreshTokenJob {
    private readonly logger = new Logger(LimparRefreshTokenJob.name);

    constructor(
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async limparTokensExpirados(): Promise<void> {
        try {
            await this.refreshTokenRepository.limparExpirados();
            this.logger.log(
                '✅ Refresh tokens expirados removidos com sucesso',
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao limpar refresh tokens: ${error.message}`,
                error.stack,
            );
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async limparTokensRevogados(): Promise<void> {
        try {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - 30);

            await this.refreshTokenRepository.limparRevogadosAntigos(
                dataLimite,
            );
            this.logger.log(
                '✅ Refresh tokens revogados antigos removidos com sucesso',
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao limpar tokens revogados: ${error.message}`,
                error.stack,
            );
        }
    }
}
