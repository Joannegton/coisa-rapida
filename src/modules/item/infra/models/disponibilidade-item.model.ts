import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { ItemModel } from './item.model';

export interface DataBloqueada {
    dataInicio: string; // ISO 8601
    dataFim: string; // ISO 8601
    motivo?: string;
}

@Entity('item_disponibilidade', { schema: 'item' })
@Index('idx_item_disponibilidade_item_id', ['itemId'], { unique: true })
@Index('idx_item_disponibilidade_disponivel', ['disponivel'])
export class DisponibilidadeItemModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'item_id', type: 'uuid' })
    itemId: string;

    @OneToOne(() => ItemModel, (item) => item.disponibilidade, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'item_id' })
    item: ItemModel;

    @Column({ type: 'boolean', default: true })
    disponivel: boolean;

    @Column({
        name: 'data_disponibilidade',
        type: 'timestamp',
        nullable: true,
    })
    dataDisponibilidade?: Date;

    @Column({
        name: 'dias_minimos_aluguel',
        type: 'integer',
        default: 1,
        unsigned: true,
    })
    diasMinimosAluguel: number;

    @Column({
        name: 'dias_maximos_aluguel',
        type: 'integer',
        default: 365,
        unsigned: true,
    })
    diasMaximosAluguel: number;

    @Column({
        name: 'permite_alugueis_consecutivos',
        type: 'boolean',
        default: true,
    })
    permitAluguelsConsecutivos: boolean;

    @Column({
        name: 'datas_bloqueadas',
        type: 'jsonb',
        default: [],
        nullable: true,
    })
    datasBloqueadas?: DataBloqueada[];

    @Column({
        name: 'permite_aluguel_por_hora',
        type: 'boolean',
        default: false,
    })
    permiteAluguelPorHora: boolean;

    @Column({
        name: 'horas_minimos_aluguel',
        type: 'integer',
        default: 1,
        unsigned: true,
    })
    horasMinimosAluguel: number;

    @Column({
        name: 'horas_maximos_aluguel',
        type: 'integer',
        default: 720,
        unsigned: true,
    })
    horasMaximosAluguel: number;

    static criar(
        props: Partial<DisponibilidadeItemModel>,
    ): DisponibilidadeItemModel {
        const disponibilidade = new DisponibilidadeItemModel();
        Object.assign(disponibilidade, props);
        return disponibilidade;
    }
}
