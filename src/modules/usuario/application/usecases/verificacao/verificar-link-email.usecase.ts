import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { UsuarioRepository } from 'src/modules/usuario/domain/repositories/usuario.repository';
import { VerificarLinkEmailDto } from '../../dtos/verificacao/verificacao-email.dto';
import { EmailVerificadoEvent } from '../../../domain/events/email-verificado.events';
import type { UsuarioEmailService } from 'src/modules/usuario/domain/services';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

export interface VerificarLinkEmailResult {
    mensagem: string;
}

@Injectable()
export class VerificarLinkEmailUseCase {
    constructor(
        @Inject('UsuarioRepository')
        private readonly usuarioRepository: UsuarioRepository,
        @Inject('UsuarioEmailService')
        private readonly emailService: UsuarioEmailService,
        private readonly auditoriaService: AuditoriaService,
        private readonly eventBus: EventBus,
    ) {}

    async execute(
        props: VerificarLinkEmailDto,
    ): Promise<VerificarLinkEmailResult> {
        const inicioExecucao = Date.now();

        try {
            const payload = this.emailService.validarTokenVerificacao(
                props.token,
            );

            const usuario = await this.usuarioRepository.buscarPorId(
                payload.sub,
            );

            if (!usuario) {
                throw new NotFoundException('Usuário não encontrado');
            }

            usuario.verificarEmail();

            await this.usuarioRepository.salvar(usuario);

            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: payload.sub,
                usuarioEmail: payload.email,
                modulo: 'usuario',
                acao: AuditoriaAcao.VERIFICAR_LINK_EMAIL,
                recurso: 'usuario',
                descricao: 'Email verificado com sucesso via link',
                nivel: 'medio',
                statusCode: 200,
                duracaoMs: Date.now() - inicioExecucao,
            });

            this.eventBus.publish(
                new EmailVerificadoEvent(payload.sub, payload.email),
            );

            return { mensagem: 'Email verificado com sucesso!' };
        } catch (error) {
            const duracaoMs = Date.now() - inicioExecucao;

            // Tentar extrair usuarioId do token se possível
            let usuarioId = 'desconhecido';
            let usuarioEmail = 'desconhecido';

            try {
                const payload = this.emailService.validarTokenVerificacao(
                    props.token,
                );
                usuarioId = payload.sub;
                usuarioEmail = payload.email;
            } catch {
                // Token inválido, manter valores padrão
            }

            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId,
                usuarioEmail,
                modulo: 'usuario',
                acao: AuditoriaAcao.VERIFICAR_LINK_EMAIL,
                recurso: 'usuario',
                descricao: `Falha ao verificar link de email: ${error.message}`,
                nivel: 'medio',
                statusCode: 400,
                duracaoMs,
            });

            throw error;
        }
    }
}
