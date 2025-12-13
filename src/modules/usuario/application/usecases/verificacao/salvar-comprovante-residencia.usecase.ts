import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { ComprovanteResidencia } from 'src/modules/usuario/domain/ComprovanteResidencia';
import type { ComprovanteResidenciaRepository } from 'src/modules/usuario/domain/repositories/comprovante-residencia.repository';
import { TipoComprovante } from 'src/modules/usuario/infra/models/comprovante-residencia.model';
import { CloudinaryService } from 'src/shared/services/Cloudinary.service';

export type SalvarComprovanteResidenciaProps = {
    usuarioId: string;
    arquivo: Express.Multer.File;
    tipoComprovante: TipoComprovante;
    observacoesUsuario?: string;
};

@Injectable()
export class SalvarComprovanteResidenciaUseCase {
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        @Inject('ComprovanteResidenciaRepository')
        private readonly comprovanteResidenciaRepository: ComprovanteResidenciaRepository,
    ) {}

    async execute(
        props: SalvarComprovanteResidenciaProps,
    ): Promise<{ mensagem: string }> {
        if (!props.arquivo)
            throw new InvalidPropsException('Arquivo é obrigatório');

        const verificacoesPendentes =
            await this.comprovanteResidenciaRepository.buscarPorUsuarioId(
                props.usuarioId,
            );

        if (verificacoesPendentes) {
            throw new ConflictException('Já existe uma verificação pendente');
        }

        const uploadResult = await this.cloudinaryService.uploadNoCloudinary({
            file: props.arquivo,
            pasta: 'comprovantes_residencia',
        });

        const comprovanteDomain = ComprovanteResidencia.criar({
            comprovanteUrl: uploadResult.url,
            tipoComprovante: props.tipoComprovante,
            observacoesUsuario: props.observacoesUsuario,
            usuarioId: props.usuarioId,
        });

        await this.comprovanteResidenciaRepository.salvar(comprovanteDomain);

        // TODO
        //  Notificar admins sobre nova verificação pendente
        // await this.notificarAdminsNovaVerificacao(comprovanteResidenciaResult.valor!, props.usuarioId);

        return {
            mensagem:
                'Comprovante de residência enviado para análise. Você será notificado em até 48h.',
        };
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
