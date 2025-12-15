import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthRepository } from '../../infra/repositories/auth.repository';
import { randomBytes } from 'node:crypto';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class SolicitarRecuperacaoSenhaUsecase {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async execute(email: string): Promise<{ token: string }> {
        const usuarioAuth = await this.authRepository.buscarPorEmail(email);

        if (!usuarioAuth) {
            throw new NotFoundException(
                'Se o email existir, um link de recuperação será enviado',
            );
        }

        const token = this.gerarCodigoRecuperacao();
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        await this.authRepository.atualizarResetToken(
            usuarioAuth.id,
            token,
            expires,
        );

        // ver se é valido event
        // Em produção, enviar email com SendGrid:
        // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        // await this.emailService.enviarEmailRecuperacaoSenha(email, resetLink);

        await this.auditoriaService.criar({
            timestamp: new Date(),
            usuarioId: usuarioAuth?.id || 'desconhecido',
            usuarioEmail: email,
            modulo: 'auth',
            acao: AuditoriaAcao.SOLICITAR_RECUPERACAO_SENHA,
            recurso: 'solicitar_recuperacao_senha',
            descricao: usuarioAuth
                ? 'Código de recuperação enviado'
                : 'Tentativa em email inexistente',
            nivel: 'medio',
            statusCode: 200,
        });

        return { token };
    }

    private gerarCodigoRecuperacao(): string {
        const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from(randomBytes(6))
            .map((byte) => charset[byte % charset.length])
            .join('');
    }
}
