import { Injectable, BadRequestException } from '@nestjs/common';
import { AuthRepository } from '../../infra/repositories/auth.repository';
import { CacheService } from 'src/shared/infra/services/cache.service';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { randomBytes } from 'node:crypto';

@Injectable()
export class ValidarCodigoRecuperacaoUsecase {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly cacheService: CacheService,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async execute(
        email: string,
        codigo: string,
    ): Promise<{ tokenTemporario: string }> {
        const usuarioAuth = await this.authRepository.buscarPorEmail(email);

        if (!usuarioAuth) {
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: 'desconhecido',
                usuarioEmail: email,
                modulo: 'auth',
                acao: AuditoriaAcao.VALIDAR_CODIGO_RECUPERACAO,
                recurso: 'validacao_codigo_recuperacao',
                descricao: `Tentativa de validação de código para email inexistente: ${email}`,
                nivel: 'medio',
                statusCode: 400,
            });
            throw new BadRequestException('Email não encontrado');
        }

        if (
            !usuarioAuth.resetSenhaToken ||
            usuarioAuth.resetSenhaToken !== codigo
        ) {
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: usuarioAuth.id,
                usuarioEmail: email,
                modulo: 'auth',
                acao: AuditoriaAcao.VALIDAR_CODIGO_RECUPERACAO,
                recurso: 'validacao_codigo_recuperacao',
                descricao: `Tentativa de validação com código inválido para email: ${email}`,
                nivel: 'medio',
                statusCode: 400,
            });
            throw new BadRequestException('Código inválido');
        }

        if (
            !usuarioAuth.resetSenhaExpiracao ||
            usuarioAuth.resetSenhaExpiracao < new Date()
        ) {
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: usuarioAuth.id,
                usuarioEmail: email,
                modulo: 'auth',
                acao: AuditoriaAcao.VALIDAR_CODIGO_RECUPERACAO,
                recurso: 'validacao_codigo_recuperacao',
                descricao: `Tentativa de validação com código expirado para email: ${email}`,
                nivel: 'medio',
                statusCode: 400,
            });
            throw new BadRequestException('Código expirado');
        }

        const tokenTemporario = randomBytes(32).toString('hex');

        await this.cacheService.definir(
            `reset:${tokenTemporario}`,
            { email, usuarioAuthId: usuarioAuth.id },
            900,
        );

        await this.auditoriaService.criar({
            timestamp: new Date(),
            usuarioId: usuarioAuth.id,
            usuarioEmail: email,
            modulo: 'auth',
            acao: AuditoriaAcao.VALIDAR_CODIGO_RECUPERACAO,
            recurso: 'validacao_codigo_recuperacao',
            descricao: `Código de recuperação validado com sucesso para email: ${email}`,
            nivel: 'medio',
            statusCode: 200,
        });

        return { tokenTemporario };
    }
}
