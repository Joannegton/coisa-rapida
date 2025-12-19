import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ItemModel } from './item.model';

export enum ItemModeracaoStatus {
    PENDENTE = 'pendente',
    EM_ANALISE = 'em_analise',
    APROVADO = 'aprovado',
    REJEITADO = 'rejeitado',
    BLOQUEADO = 'bloqueado',
}

@Entity('item_moderacao', { schema: 'item' })
@Index('idx_item_moderacao_item_id', ['itemId'], { unique: true })
@Index('idx_item_moderacao_status', ['status'])
@Index('idx_item_moderacao_criado_em', ['criadoEm'])
export class ModeracaoItemModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'item_id', type: 'uuid' })
    itemId: string;

    @ManyToOne(() => ItemModel, (item) => item.moderacao, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'item_id' })
    item: ItemModel;

    @Column({
        type: 'enum',
        enum: ItemModeracaoStatus,
        default: ItemModeracaoStatus.PENDENTE,
    })
    status: ItemModeracaoStatus;

    @Column({
        name: 'contem_palavras_proibidas',
        type: 'boolean',
        nullable: true,
    })
    contemPalavrasProibidas?: boolean;

    @Column({
        name: 'contem_links_externos',
        type: 'boolean',
        nullable: true,
    })
    contemLinksExternos?: boolean;

    @Column({
        name: 'contem_telefone',
        type: 'boolean',
        nullable: true,
    })
    contemTelefone?: boolean;

    @Column({
        name: 'requer_aprovacao_manual',
        type: 'boolean',
        default: false,
    })
    requerAprovacaoManual?: boolean;

    @Column({
        name: 'motivo_bloqueio',
        type: 'text',
        nullable: true,
    })
    motivoBloqueio?: string;

    @Column({
        name: 'moderador_id',
        type: 'uuid',
        nullable: true,
    })
    moderadorId?: string;

    @Column({
        name: 'observacoes_moderacao',
        type: 'text',
        nullable: true,
    })
    observacoesModeração?: string;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    @Column({
        name: 'data_resolucao',
        type: 'timestamp',
        nullable: true,
    })
    dataResolucao?: Date;

    static criar(props: Partial<ModeracaoItemModel>): ModeracaoItemModel {
        const moderacao = new ModeracaoItemModel();
        Object.assign(moderacao, props);
        return moderacao;
    }
}
