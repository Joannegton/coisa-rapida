import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { CaucaoModel } from './caucao.value-object';
import { MultaModel } from './multa.value-object';
import { ContratoModel } from './contrato.value-object';
import { LocadorModel, LocatarioModel } from './pessoa-aluguel.value-object';
import { SnapshotItemModel } from './snapshot-item.value-object';

export enum AluguelStatus {
    PAGAMENTO_PENDENTE = 'pagamento_pendente',
    SOLICITADO = 'solicitado',
    CONFIRMADO = 'confirmado',
    ATIVO = 'ativo',
    DEVOLVIDO = 'devolvido',
    CONCLUIDO = 'concluido',
    CANCELADO = 'cancelado',
    DISPUTADO = 'disputado',
}

@Entity('aluguel', { schema: 'core' })
@Index(['itemId'])
@Index(['status', 'criadoEm'])
@Index(['dataInicio', 'dataFim'])
export class AluguelModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column(() => LocadorModel, { prefix: false })
    locador: LocadorModel;

    @Column(() => LocatarioModel, { prefix: false })
    locatario: LocatarioModel;

    @Column({ name: 'item_id', type: 'uuid' })
    itemId: string;

    @Column(() => SnapshotItemModel, { prefix: false })
    snapshotItem: SnapshotItemModel;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        name: 'preco_total',
    })
    precoTotal: number;

    @Column(() => CaucaoModel, { prefix: false })
    caucao?: CaucaoModel;

    @Column(() => MultaModel, { prefix: false })
    multa?: MultaModel;

    @Column(() => ContratoModel, { prefix: false })
    contrato: ContratoModel;

    @Column({ type: 'timestamptz', name: 'data_inicio' })
    dataInicio: Date;

    @Column({
        type: 'timestamptz',
        name: 'data_fim',
    })
    dataFim: Date;

    @Column({
        type: 'text',
        name: 'observacoes_locatario',
        nullable: true,
    })
    observacoesLocatario?: string;

    @Column({
        type: 'text',
        name: 'motivo_recusa_locador',
        nullable: true,
    })
    motivoRecusaLocador?: string;

    @Column({
        type: 'enum',
        enum: AluguelStatus,
        name: 'status',
        default: AluguelStatus.SOLICITADO,
    })
    status: AluguelStatus;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    static criar(props: Partial<AluguelModel>): AluguelModel {
        const aluguel = new AluguelModel();
        Object.assign(aluguel, props);
        return aluguel;
    }
}
