import { Inject, Injectable } from '@nestjs/common';
import type { UsuarioEmailService } from 'src/modules/usuario/domain/services';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

export interface EnviarLinkVerificacaoEmailResponse {
    mensagem: string;
}

@Injectable()
export class EnviarLinkVerificacaoEmailUseCase {
    constructor(
        @Inject('UsuarioEmailService')
        private readonly emailService: UsuarioEmailService,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async execute(
        usuarioId: string,
        email: string,
    ): Promise<EnviarLinkVerificacaoEmailResponse> {
        const inicioExecucao = Date.now();

        try {
            const verificationUrl = this.emailService.gerarUrlVerificacao(
                usuarioId,
                email,
            );

            await this.emailService.enviarLinkVerificacao(
                email,
                verificationUrl,
            );

            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId,
                usuarioEmail: email,
                modulo: 'usuario',
                acao: AuditoriaAcao.VERIFICAR_LINK_EMAIL,
                recurso: 'usuario',
                descricao: 'Link de verificação de email enviado com sucesso',
                nivel: 'medio',
                statusCode: 200,
                duracaoMs: Date.now() - inicioExecucao,
            });

            return { mensagem: 'Link de verificação enviado com sucesso' };
        } catch (error) {
            const duracaoMs = Date.now() - inicioExecucao;

            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId,
                usuarioEmail: email,
                modulo: 'usuario',
                acao: AuditoriaAcao.VERIFICAR_LINK_EMAIL,
                recurso: 'usuario',
                descricao: `Falha ao enviar link de verificação de email: ${error.message}`,
                nivel: 'medio',
                statusCode: 500,
                duracaoMs,
            });

            throw error;
        }
    }
}
