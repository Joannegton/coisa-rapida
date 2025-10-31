import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from "src/shared/resultado";
import { Injectable } from "@nestjs/common";
import { VerificacaoResidenciaRepository } from "../../infra/repositories/VerificacaoResidencia.repository";
import { NotificacaoRepository, TipoNotificacao } from "../../infra/repositories/Notificacao.repository";
import { UsuarioFirestoreService } from "../../infra/services/UsuarioFirestore.service";
import { Endereco } from "../../domain/Endereco";
import { VerificacaoResidencia } from "../../domain/VerificacaoResidencia";
import { CloudinaryService } from "../../infra/services/Cloudinary.service";
import { Usuario } from "../../domain/Usuario";

export type SalvarComprovanteResidenciaProps = {
    usuarioId: string;
    comprovante: Express.Multer.File;
    tipoComprovante: string;
    observacoes?: string;
}
export type ComprovanteResidenciaExceptions = ServicoExcecao

@Injectable()
export class SalvarComprovanteResidenciaUseCase {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly verificacaoRepository: VerificacaoResidenciaRepository,
        private readonly usuarioFirestoreService: UsuarioFirestoreService,
    ) {}

    async execute(props: SalvarComprovanteResidenciaProps): ResultadoAssincrono<string, ComprovanteResidenciaExceptions> {
        try {
            const usuarioFirebaseResult = await this.usuarioFirestoreService.buscarPorId(props.usuarioId);
            if (usuarioFirebaseResult.ehFalha() || !usuarioFirebaseResult.valor) {
                return ResultadoUtil.falha(new ServicoExcecao('Usuário não encontrado'));
            }

            const verificacoesPendentes = await this.verificacaoRepository.buscarPendentePorUsuarioId(props.usuarioId);
            if (verificacoesPendentes.ehSucesso()) {
                return ResultadoUtil.falha(new ServicoExcecao('Já existe uma verificação pendente'));
            }

            // Upload do comprovante para Cloudinary
            const UploadResult = await this.cloudinaryService.uploadNoCloudinary({
                file: props.comprovante,
                pasta: 'comprovantes_residencia'
            });
            if (UploadResult.ehFalha()) {
                return ResultadoUtil.falha(UploadResult.erro || new ServicoExcecao('Erro no upload do comprovante'));
            }

            const usuarioResult = Usuario.criar(usuarioFirebaseResult.valor, props.usuarioId)

            if (usuarioResult.ehFalha() || !usuarioResult.valor) {
                return ResultadoUtil.falha(usuarioResult.erro!);
            }

            const verificacaoDomain = VerificacaoResidencia.criar({
                comprovanteUrl: UploadResult.valor?.secure_url!,
                tipoComprovante: props.tipoComprovante,
                observacoesUsuario: props.observacoes,
                usuario: usuarioResult.valor!,
            })

            if (verificacaoDomain.ehFalha()) {
                return ResultadoUtil.falha(verificacaoDomain.erro || new ServicoExcecao('Erro ao criar verificação de residência'));
            }

            // Criar verificação
            const comprovanteResidenciaResult = await this.verificacaoRepository.salvar(verificacaoDomain.valor!);

            if (comprovanteResidenciaResult.ehFalha()) {
                return ResultadoUtil.falha(comprovanteResidenciaResult.erro || new ServicoExcecao('Erro ao salvar verificação'));
            }

            // // Notificar admins sobre nova verificação pendente
            // await this.notificarAdminsNovaVerificacao(comprovanteResidenciaResult.valor!, props.usuarioId);

            return ResultadoUtil.sucesso('Comprovante de residência enviado para análise. Você será notificado em até 48h.');
        } catch (error) {
            return ResultadoUtil.falha(error);
        }
    }

    // private async notificarAdminsNovaVerificacao(verificacaoId: string, usuarioId: string): Promise<void> {
    //     try {
    //         // Buscar dados do usuário
    //         const usuarioResult = await this.usuarioRepository.buscarPorId(usuarioId);
    //         if (usuarioResult.ehFalha() || !usuarioResult.valor) {
    //             return;
    //         }

    //         const usuario = usuarioResult.valor;

    //         // Buscar admins
    //         const adminsResult = await this.usuarioRepository.listarAdmins();
    //         if (adminsResult.ehFalha()) {
    //             return;
    //         }

    //         // Criar notificações para cada admin
    //         const notificacoes = adminsResult.valor!.map(admin => ({
    //             destinatarioId: admin.id,
    //             tipo: TipoNotificacao.VERIFICACAO_PENDENTE,
    //             titulo: 'Nova verificação de residência',
    //             mensagem: `${usuario.nome} enviou comprovante de residência para análise`,
    //             dados: {
    //                 verificacaoId,
    //                 usuarioId,
    //             },
    //         }));

    //         await this.notificacaoRepository.criarMultiplas(notificacoes);
    //     } catch (error) {
    //         console.error('Erro ao notificar admins:', error);
    //     }
    // }
}