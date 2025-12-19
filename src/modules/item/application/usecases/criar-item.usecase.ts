import { Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { CriarItemDto } from '../dtos/criar-item.dto';
import type { UploadImagemService } from '../../domain/services/upload-imagem.service';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import type {
    UsuarioResult,
    UsuarioService,
} from '../../domain/services/usuario.service';
import { Foto } from '../../domain/foto';
import { Item } from '../../domain/item';
import { LocalizacaoItem } from '../../domain/localizacao';
import { Preco } from '../../domain/precos';
import { Disponibilidade } from '../../domain/disponibilidade';
import { ModeracaoFilaService } from '../../infra/services/moderacao.fila.service';
import { ItemModeradoEvent } from '../../domain/events/item-moderado.event';
import { Moderacao } from '../../domain/moderacao';
import { ValidadorConteudo } from 'src/shared/utils/validador-conteudo.utils';
import { ItemModeracaoStatus } from '../../infra/models/moderacao-item.model';

export type CriarItemUseCaseProps = CriarItemDto & {
    usuarioId: string;
};

export class CriarItemUseCase {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
        @Inject('UploadService')
        private readonly uploadService: UploadImagemService,
        @Inject('UsuarioService')
        private readonly usuarioService: UsuarioService,
        private readonly moderacaoFilaService: ModeracaoFilaService,
        private readonly eventBus: EventBus,
    ) {}

    async execute(props: CriarItemUseCaseProps): Promise<void> {
        if (!props.fotos || props.fotos.length <= 0 || props.fotos.length > 3)
            throw new InvalidPropsException(
                'É necessário enviar entre 1 e 3 imagens.',
            );

        const usuario = await this.usuarioService.buscar(props.usuarioId);
        if (!usuario.verificado) {
            throw new InvalidPropsException('Você não está verificado.');
        }

        if (!usuario.endereco)
            throw new InvalidPropsException('Complete seu endereço.');

        const localizacao = LocalizacaoItem.criar({
            cep: usuario.endereco.cep,
            cidade: usuario.endereco.cidade,
            estado: usuario.endereco.estado,
            latitude: usuario.endereco.latitude!,
            longitude: usuario.endereco.longitude!,
            endereco: this.formatarEndereco(usuario),
        });

        const precos = Preco.criar({
            precoPorDia: props.precoPorDia,
            valorCaucao: props.valorCaucao,
            precoPorHora: props.precoPorHora,
            caucaoObrigatoria: props.caucaoObrigatoria,
        });

        const disponibilidade = Disponibilidade.criar({
            diasMaximosAluguel: props.diasMaximosAluguel,
            diasMinimosAluguel: props.diasMinimosAluguel,
            horasMaximosAluguel: props.horasMaximasAluguel,
            horasMinimosAluguel: props.horasMinimasAluguel,
            permitAluguelsConsecutivos: props.permitAluguelsConsecutivos,
        });

        const validacao = ValidadorConteudo.validar(
            `${props.nome} ${props.descricao}`,
        );

        if (validacao.problemasDetectados.length > 0) {
            throw new InvalidPropsException(
                `Conteúdo inválido: ${validacao.problemasDetectados.join('; ')}`,
            );
        }

        const moderacao = Moderacao.criar({
            status: ItemModeracaoStatus.APROVADO,
            contemPalavrasProibidas: validacao.temPalavrasProibidas,
            contemLinksExternos: validacao.temLinks,
            contemTelefone: validacao.temTelefone || validacao.temWhatsapp,
            requerAprovacaoManual: false,
            dataResolucao: new Date(),
        });

        const imagens = await this.criarFotosDomain(
            props.fotos,
            props.usuarioId,
        );

        const itemDomain = Item.criar({
            nome: props.nome,
            descricao: props.descricao,
            categoria: props.categoria,
            estado: props.estado,
            tipoAnuncio: props.tipoAnuncio,
            usuarioId: props.usuarioId,
            fotos: imagens,
            localizacao: localizacao,
            precos: precos,
            disponibilidade: disponibilidade,
            moderacao: moderacao,
        });

        const itemSalvo = await this.itemRepository.criar(itemDomain);

        // OTIMIZAÇÃO: Fire-and-forget - não aguarda confirmação
        // Executa em paralelo sem bloquear resposta ao cliente
        Promise.all([
            this.moderacaoFilaService
                .agendarVerificacaoAvancada({
                    descricao: props.descricao,
                    itemId: itemSalvo.id,
                    nome: props.nome,
                    usuarioId: props.usuarioId,
                    prioridade: 'alto',
                })
                .catch((error) => {
                    // Log do erro mas não falha a criação do item
                    console.error(
                        'Erro ao agendar moderação (não crítico):',
                        error,
                    );
                }),
            // EventBus também não bloqueia
            Promise.resolve(
                this.eventBus.publish(
                    new ItemModeradoEvent(
                        itemSalvo.id,
                        moderacao.status,
                        itemSalvo.criadoEm,
                        validacao.problemasDetectados,
                    ),
                ),
            ),
        ]).catch(() => {
            // Ignora erros de processos secundários
        });

        // Retorna imediatamente após salvar no banco
    }

    private async criarFotosDomain(
        fotos: Express.Multer.File[],
        usuarioId: string,
    ): Promise<Foto[]> {
        const uploadFotoResult = await Promise.all(
            fotos.map((foto) =>
                this.uploadService.uploadImagem({ file: foto, usuarioId }),
            ),
        );

        const imagens: Foto[] = [];
        for (const foto of uploadFotoResult) {
            const nomeArquivo =
                foto.publicId.split('/').pop() || 'imagem-desconhecida';

            const imagem = Foto.criar({
                id: foto.publicId,
                url: foto.secure_url,
                nomeArquivo: nomeArquivo,
                tamanhoBytes: foto.bytes,
                principal: false,
                ordem: imagens.length + 1,
            });
            imagens.push(imagem);
        }
        imagens[0].definirComoPrincipal();

        return imagens;
    }

    private formatarEndereco(usuario: UsuarioResult): string {
        return `${usuario.endereco?.rua}, ${usuario.endereco?.numero} - ${usuario.endereco?.bairro}, ${usuario.endereco?.cidade} - ${usuario.endereco?.estado}, ${usuario.endereco?.cep}`;
    }
}
