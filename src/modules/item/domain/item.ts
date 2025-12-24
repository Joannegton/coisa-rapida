import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import {
    CategoriaItem,
    EstadoItem,
    StatusItem,
    TipoAnuncio,
} from '../infra/models/item.model';
import { Preco } from './precos';
import { LocalizacaoItem } from './localizacao';
import { Foto } from './foto';
import { Moderacao } from './moderacao';
import { Disponibilidade } from './disponibilidade';
import { ItemDto } from '../application/dtos/responses/item.dto';
import { ItemCardDto } from '../application/dtos/responses/item-cards.dto';

export type ItemProps = {
    usuarioId: string;
    nome: string;
    descricao: string;
    categoria: CategoriaItem;
    estado: EstadoItem;
    tipoAnuncio: TipoAnuncio;
    status: StatusItem;
    precos: Preco;
    localizacao: LocalizacaoItem;
    fotos: Foto[];
    moderacao?: Moderacao;
    disponibilidade?: Disponibilidade;
    aluguelsTotais: number;
    versao: number;
    criadoEm: Date;
    atualizadoEm: Date;
    dataArquivamento?: Date;
    dataExclusao?: Date;
};

export type CriarItemProps = {
    usuarioId: string;
    nome: string;
    descricao: string;
    categoria: CategoriaItem;
    estado: EstadoItem;
    tipoAnuncio: TipoAnuncio;
    precos: Preco;
    localizacao: LocalizacaoItem;
    fotos: Foto[];
    moderacao?: Moderacao;
    disponibilidade?: Disponibilidade;
};

export class Item {
    private readonly _id: string;
    private readonly props: ItemProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as ItemProps;
    }

    static criar(props: CriarItemProps): Item {
        const item = new Item();
        item.setUsuarioId(props.usuarioId);
        item.setNome(props.nome);
        item.setDescricao(props.descricao);
        item.setCategoria(props.categoria);
        item.setEstado(props.estado);
        item.setTipoAnuncio(props.tipoAnuncio);
        item.setStatus(StatusItem.ATIVO);
        item.setPrecos(props.precos);
        item.setLocalizacao(props.localizacao);
        item.setFotos(props.fotos);
        item.setModeracao(props.moderacao);
        item.setDisponibilidade(props.disponibilidade);

        return item;
    }

    static carregar(props: ItemProps, id: string): Item {
        const item = new Item(id);
        item.props.usuarioId = props.usuarioId;
        item.props.nome = props.nome;
        item.props.descricao = props.descricao;
        item.props.categoria = props.categoria;
        item.props.estado = props.estado;
        item.props.tipoAnuncio = props.tipoAnuncio;
        item.props.status = props.status;
        item.props.precos = props.precos;
        item.props.localizacao = props.localizacao;
        item.props.fotos = props.fotos;
        item.props.moderacao = props.moderacao;
        item.props.disponibilidade = props.disponibilidade;
        item.props.aluguelsTotais = props.aluguelsTotais;
        item.props.dataArquivamento = props.dataArquivamento;
        item.props.dataExclusao = props.dataExclusao;
        item.props.versao = props.versao;
        item.props.criadoEm = props.criadoEm;
        item.props.atualizadoEm = props.atualizadoEm;

        return item;
    }

    private setUsuarioId(usuarioId: string) {
        if (!usuarioId || usuarioId.trim().length === 0) {
            throw new InvalidPropsException('ID do usuário é obrigatório');
        }
        this.props.usuarioId = usuarioId;
    }

    private setNome(nome: string) {
        if (!nome || nome.trim().length < 5) {
            throw new InvalidPropsException(
                'Nome do item deve ter pelo menos 5 caracteres',
            );
        }
        this.props.nome = nome;
    }

    private setDescricao(descricao: string) {
        if (!descricao || descricao.trim().length < 50) {
            throw new InvalidPropsException(
                'Descrição do item deve ter pelo menos 50 caracteres',
            );
        }
        this.props.descricao = descricao;
    }

    private setCategoria(categoria: CategoriaItem) {
        if (!categoria) {
            throw new InvalidPropsException('Categoria do item é obrigatória');
        }
        this.props.categoria = categoria;
    }

    private setEstado(estado: EstadoItem) {
        if (!estado) {
            throw new InvalidPropsException('Estado do item é obrigatório');
        }
        this.props.estado = estado;
    }

    private setTipoAnuncio(tipoAnuncio: TipoAnuncio) {
        if (!tipoAnuncio) {
            throw new InvalidPropsException('Tipo de anúncio é obrigatório');
        }
        this.props.tipoAnuncio = tipoAnuncio;
    }

    private setStatus(status: StatusItem) {
        if (!status) {
            throw new InvalidPropsException('Status do item é obrigatório');
        }
        this.props.status = status;
    }

    private setPrecos(precos: Preco) {
        if (!precos) {
            throw new InvalidPropsException('Preços do item são obrigatórios');
        }
        this.props.precos = precos;
    }

    private setLocalizacao(localizacao: LocalizacaoItem) {
        if (!localizacao) {
            throw new InvalidPropsException(
                'Localização do item é obrigatória',
            );
        }
        this.props.localizacao = localizacao;
    }

    private setFotos(fotos: Foto[]) {
        if (!fotos || fotos.length === 0) {
            throw new InvalidPropsException('Mínimo 1 foto é obrigatória');
        }
        this.props.fotos = fotos;
    }

    private setModeracao(moderacao?: Moderacao) {
        this.props.moderacao = moderacao;
    }

    private setDisponibilidade(disponibilidade?: Disponibilidade) {
        this.props.disponibilidade = disponibilidade;
    }

    private setAluguelsTotais(aluguelsTotais: number) {
        if (aluguelsTotais < 0) {
            throw new InvalidPropsException(
                'Total de aluguéis não pode ser negativo',
            );
        }
        this.props.aluguelsTotais = aluguelsTotais;
    }

    private setDataArquivamento(dataArquivamento?: Date) {
        this.props.dataArquivamento = dataArquivamento;
    }

    private setDataExclusao(dataExclusao?: Date) {
        this.props.dataExclusao = dataExclusao;
    }

    get id(): string {
        return this._id;
    }

    get usuarioId(): string {
        return this.props.usuarioId;
    }

    get nome(): string {
        return this.props.nome;
    }

    get descricao(): string {
        return this.props.descricao;
    }

    get categoria(): CategoriaItem {
        return this.props.categoria;
    }

    get estado(): EstadoItem {
        return this.props.estado;
    }

    get tipoAnuncio(): TipoAnuncio {
        return this.props.tipoAnuncio;
    }

    get status(): StatusItem {
        return this.props.status;
    }

    get precos(): Preco {
        return this.props.precos;
    }

    get localizacao(): LocalizacaoItem {
        return this.props.localizacao;
    }

    get fotos(): Foto[] {
        return this.props.fotos;
    }

    get moderacao(): Moderacao | undefined {
        return this.props.moderacao;
    }

    get disponibilidade(): Disponibilidade | undefined {
        return this.props.disponibilidade;
    }

    get aluguelsTotais(): number {
        return this.props.aluguelsTotais;
    }

    get versao(): number {
        return this.props.versao;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    get atualizadoEm(): Date {
        return this.props.atualizadoEm;
    }

    get dataArquivamento(): Date | undefined {
        return this.props.dataArquivamento;
    }

    get dataExclusao(): Date | undefined {
        return this.props.dataExclusao;
    }

    toDto(): ItemDto {
        return {
            id: this.id,
            usuarioId: this.usuarioId,
            nome: this.nome,
            descricao: this.descricao,
            categoria: this.categoria,
            estado: this.estado,
            tipoAnuncio: this.tipoAnuncio,
            status: this.status,
            precoPorDia: this.precos.precoPorDia,
            precoPorHora: this.precos.precoPorHora,
            valorCaucao: this.precos.valorCaucao,
            localizacaoLat: this.localizacao.latitude,
            localizacaoLng: this.localizacao.longitude,
            localizacaoEndereco: this.localizacao.endereco,
            localizacaoCidade: this.localizacao.cidade,
            localizacaoEstado: this.localizacao.estado,
            localizacaoCep: this.localizacao.cep,
            permiteAluguelPorHora: this.disponibilidade?.permiteAluguelPorHora,
            horasMinimosAluguel: this.disponibilidade?.horasMinimosAluguel,
            horasMaximosAluguel: this.disponibilidade?.horasMaximosAluguel,
            fotosUrls: this.fotos?.map((f) => f.url) || [],
            fotoPrincipalUrl: this.fotos?.find((f) => f.principal)?.url,
            disponivel: this.disponibilidade?.disponivel ?? false,
            aluguelsTotais: this.aluguelsTotais,
            diasMinimosAluguel: this.disponibilidade?.diasMinimosAluguel ?? 1,
            diasMaximosAluguel: this.disponibilidade?.diasMaximosAluguel ?? 30,
            criadoEm: this.criadoEm,
            atualizadoEm: this.atualizadoEm,
        };
    }

    toCardDto(): ItemCardDto {
        return {
            id: this.id,
            usuarioId: this.usuarioId,
            nome: this.nome,
            categoria: this.categoria,
            estado: this.estado,
            tipoAnuncio: this.tipoAnuncio,
            status: this.status,
            precoPorDia: this.precos.precoPorDia,
            precoPorHora: this.precos.precoPorHora,
            disponivel: this.disponibilidade?.disponivel ?? false,
            fotoPrincipalUrl: this.fotos?.find((f) => f.principal)?.url,
            permiteAluguelPorHora: this.disponibilidade?.permiteAluguelPorHora,
            valorCaucao: this.precos.valorCaucao,
        };
    }
}
