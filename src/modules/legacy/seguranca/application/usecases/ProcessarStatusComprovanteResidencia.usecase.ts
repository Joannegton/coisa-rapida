import {
    ResultadoAssincrono,
    ResultadoUtil,
    ServicoExcecao,
} from 'src/shared/utils/resultado';
import { Injectable } from '@nestjs/common';
import { VerificacaoResidenciaRepository } from '../../infra/repositories/VerificacaoResidencia.repository';
import { UsuarioFirestoreService } from '../../infra/services/UsuarioFirestore.service';
import { ModeracaoStatus } from '../../domain/VerificacaoResidencia';
import { NotificacaoService } from '../../infra/services/Notificacao.service';

export type ProcessarStatusComprovanteResidenciaProps = {
    idComprovanteResidencia: string;
    status: ModeracaoStatus.APROVADO | ModeracaoStatus.REJEITADO;
    motivoRejeicao: string;
    observacoes?: string;
};
export type ProcessarStatusComprovanteResidenciaExceptions = ServicoExcecao;

@Injectable()
export class ProcessarStatusComprovanteResidenciaUseCase {
    constructor(
        private readonly verificacaoRepository: VerificacaoResidenciaRepository,
        private readonly notificacaoService: NotificacaoService,
        private readonly usuarioFirestoreService: UsuarioFirestoreService,
    ) {}

    async execute(
        props: ProcessarStatusComprovanteResidenciaProps,
    ): ResultadoAssincrono<
        string,
        ProcessarStatusComprovanteResidenciaExceptions
    > {
        try {
            const verificacaoResult =
                await this.verificacaoRepository.buscarPorId(
                    props.idComprovanteResidencia,
                );
            if (verificacaoResult.ehFalha() || !verificacaoResult.valor) {
                return ResultadoUtil.falha(
                    verificacaoResult.erro ||
                        new ServicoExcecao(
                            'Verificação de residência não encontrada',
                        ),
                );
            }

            verificacaoResult.valor!.processarAnalise({
                status: props.status,
                moderadorId: 'sistema',
                motivoRejeicao: props.motivoRejeicao,
                observacoes: props.observacoes,
            });

            const salvarResult = await this.verificacaoRepository.atualizar(
                verificacaoResult.valor!,
            );
            if (salvarResult.ehFalha()) {
                return ResultadoUtil.falha(
                    salvarResult.erro ||
                        new ServicoExcecao('Erro ao salvar verificação'),
                );
            }

            const atualizaUsuarioFirebaseResult =
                await this.usuarioFirestoreService.atualizarUsuario(
                    verificacaoResult.valor?.usuario.id!,
                    {
                        statusEndereco: props.status,
                        atualizadoEm: new Date(),
                    },
                );
            if (atualizaUsuarioFirebaseResult.ehFalha()) {
                console.error(
                    'Salvou no Pg mas não no Firebase:',
                    atualizaUsuarioFirebaseResult.erro,
                );
                return ResultadoUtil.falha(
                    atualizaUsuarioFirebaseResult.erro ||
                        new ServicoExcecao(
                            'Erro ao atualizar usuário no Firestore',
                        ),
                );
            }

            const notificarResult = await this.notificacaoService.enviar({
                destinatarioId: verificacaoResult.valor!.usuario.id,
                titulo:
                    props.status === ModeracaoStatus.APROVADO
                        ? 'Comprovante aprovado'
                        : 'Comprovante rejeitado',
                mensagem:
                    props.status === ModeracaoStatus.APROVADO
                        ? 'Seu comprovante de residência foi aprovado com sucesso.'
                        : `Seu comprovante de residência foi rejeitado.`,
                dados: {
                    tipo:
                        props.status === ModeracaoStatus.APROVADO
                            ? 'aprovacao_residencia'
                            : 'rejeicao_residencia',
                    rota: '/perfil/documentos',
                },
            });
            if (notificarResult.ehFalha()) {
                console.error('Notificação não enviada:', notificarResult.erro);
                return ResultadoUtil.falha(
                    notificarResult.erro ||
                        new ServicoExcecao('Erro ao enviar notificação'),
                );
            }

            return ResultadoUtil.sucesso(notificarResult.valor!);
        } catch (error) {
            return ResultadoUtil.falha(error);
        }
    }
}
