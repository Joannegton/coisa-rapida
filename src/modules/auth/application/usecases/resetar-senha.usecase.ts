import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthRepository } from '../../infra/repositories/auth.repository';
import { BcryptService } from '../../infra/services/bcrypt.service';
import { CacheService } from 'src/shared/infra/services/cache.service';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class ResetarSenhaUsecase {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly bcryptService: BcryptService,
        private readonly cacheService: CacheService,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async execute(tokenTemporario: string, novaSenha: string): Promise<void> {
        const cacheKey = `reset:${tokenTemporario}`;
        const data = await this.cacheService.obter<{
            email: string;
            usuarioAuthId: string;
        }>(cacheKey);

        if (!data) {
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: 'desconhecido',
                usuarioEmail: undefined,
                modulo: 'auth',
                acao: AuditoriaAcao.RESETAR_SENHA,
                recurso: 'tentativa_resetar_senha',
                descricao: `Tentativa de reset de senha com token temporário inválido ou expirado`,
                nivel: 'medio',
                statusCode: 400,
            });
            throw new BadRequestException(
                'Token temporário inválido ou expirado',
            );
        }

        const usuarioAuth = await this.authRepository.buscarPorEmail(
            data.email,
        );

        if (!usuarioAuth) {
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: 'desconhecido',
                usuarioEmail: data.email,
                modulo: 'auth',
                acao: AuditoriaAcao.RESETAR_SENHA,
                recurso: 'tentativa_resetar_senha',
                descricao: `Tentativa de reset de senha para usuário não encontrado: ${data.email}`,
                nivel: 'medio',
                statusCode: 400,
            });
            throw new BadRequestException('Usuário não encontrado');
        }

        const hashSenha = await this.bcryptService.hashSenha(novaSenha);
        usuarioAuth.hashSenha = hashSenha;

        await this.authRepository.salvar(usuarioAuth);

        await this.authRepository.limparResetToken(usuarioAuth.id);

        await this.cacheService.remover(cacheKey);

        await this.auditoriaService.criar({
            timestamp: new Date(),
            usuarioId: usuarioAuth.id,
            usuarioEmail: data.email,
            modulo: 'auth',
            acao: AuditoriaAcao.RESETAR_SENHA,
            recurso: 'resetar_senha',
            descricao: `Senha resetada com sucesso para email: ${data.email}`,
            nivel: 'medio',
            statusCode: 200,
        });
    }
}
