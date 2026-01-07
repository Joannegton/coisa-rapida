import { UsuarioModel } from 'src/modules/usuario/infra/models/usuario.model';
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    VersionColumn,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { LocalizacaoItemModel } from './localizacao-item.value-object';
import { PrecosItemModel } from './precos-item.value-object';
import { FotosItemModel } from './fotos-item.model';
import { ModeracaoItemModel } from './moderacao-item.model';
import { DisponibilidadeItemModel } from './disponibilidade-item.model';

export enum CategoriaItem {
    ELETRONICOS = 'ELETRONICOS',
    FERRAMENTAS = 'FERRAMENTAS',
    ESPORTES = 'ESPORTES',
    EVENTOS = 'EVENTOS',
    MODA = 'MODA',
    MOBILIAS = 'MOBILIAS',
    VEICULOS = 'VEICULOS',
    LIVROS_MIDIAS = 'LIVROS_MIDIAS',
    OUTROS = 'OUTROS',
}

export enum EstadoItem {
    NOVO = 'NOVO',
    COMO_NOVO = 'COMO_NOVO',
    BOM = 'BOM',
    REGULAR = 'REGULAR',
    PARA_CONSERTAR = 'PARA_CONSERTAR',
}

export enum TipoAnuncio {
    ALUGUEL = 'ALUGUEL',
    VENDA = 'VENDA',
    AMBOS = 'AMBOS',
}

export enum StatusItem {
    RASCUNHO = 'RASCUNHO',
    PENDENTE = 'PENDENTE',
    ATIVO = 'ATIVO',
    INATIVO = 'INATIVO',
    ARQUIVADO = 'ARQUIVADO',
    EXCLUIDO = 'EXCLUIDO',
}

@Entity('item', { schema: 'item' })
@Index('idx_item_usuario_status', ['usuarioId', 'status'])
@Index('idx_item_categoria_status', ['categoria', 'status'])
@Index('idx_item_criado_em', ['criadoEm'])
@Index('idx_item_atualizado_em', ['atualizadoEm'])
export class ItemModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'usuario_id', type: 'uuid' })
    usuarioId: string;

    @ManyToOne(() => UsuarioModel)
    @JoinColumn({ name: 'usuario_id' })
    usuario: UsuarioModel;

    @Column({ type: 'varchar', length: 255 })
    nome: string;

    @Column({ type: 'text' })
    descricao: string;

    @Column({
        type: 'enum',
        enum: CategoriaItem,
        default: CategoriaItem.OUTROS,
    })
    categoria: CategoriaItem;

    @Column({
        type: 'enum',
        enum: EstadoItem,
        default: EstadoItem.BOM,
    })
    estado: EstadoItem;

    @Column({
        name: 'tipo_anuncio',
        type: 'enum',
        enum: TipoAnuncio,
        default: TipoAnuncio.ALUGUEL,
    })
    tipoAnuncio: TipoAnuncio;

    @Column({
        type: 'enum',
        enum: StatusItem,
        default: StatusItem.RASCUNHO,
    })
    status: StatusItem;

    @Column(() => PrecosItemModel, { prefix: false })
    precos: PrecosItemModel;

    @Column(() => LocalizacaoItemModel, { prefix: false })
    localizacao: LocalizacaoItemModel;

    @Column({
        name: 'alugueis_totais',
        type: 'integer',
        default: 0,
        unsigned: true,
    })
    aluguelsTotais: number;

    @Column({
        name: 'vetor_busca',
        type: 'tsvector',
        select: false,
        insert: false,
        update: false,
    })
    vetorBusca: string;

    @OneToMany(() => FotosItemModel, (foto) => foto.item, {
        cascade: true,
        eager: false,
    })
    fotos: FotosItemModel[];

    @OneToOne(() => ModeracaoItemModel, (moderacao) => moderacao.item, {
        cascade: ['insert', 'update'],
        eager: false,
    })
    moderacao?: ModeracaoItemModel;

    @OneToOne(
        () => DisponibilidadeItemModel,
        (disponibilidade) => disponibilidade.item,
        {
            cascade: ['insert', 'update'],
            eager: false,
        },
    )
    disponibilidade?: DisponibilidadeItemModel;

    @VersionColumn()
    versao: number;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    @Column({
        name: 'data_arquivamento',
        type: 'timestamp',
        nullable: true,
    })
    dataArquivamento?: Date;

    @Column({
        name: 'data_exclusao',
        type: 'timestamp',
        nullable: true,
    })
    dataExclusao?: Date;

    static criar(props: Partial<ItemModel>): ItemModel {
        const item = new ItemModel();
        Object.assign(item, props);

        // Estabelecer relacionamento bidirecional com fotos para cascade funcionar
        if (item.fotos && item.fotos.length > 0) {
            item.fotos.forEach((foto) => {
                foto.item = item;
                if (item.id) {
                    foto.itemId = item.id;
                }
            });
        }

        // Estabelecer relacionamento bidirecional com disponibilidade
        if (item.disponibilidade) {
            item.disponibilidade.item = item;
            if (item.id) {
                item.disponibilidade.itemId = item.id;
            }
        }

        // Estabelecer relacionamento bidirecional com moderacao
        if (item.moderacao) {
            item.moderacao.item = item;
            if (item.id) {
                item.moderacao.itemId = item.id;
            }
        }

        return item;
    }
}
