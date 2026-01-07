import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { AluguelModel } from './aluguel.model';
import { SnapshotItemModel } from './snapshot-item.value-object';

@Entity('aluguel_snapshot', { schema: 'core' })
@Index(['aluguelId'])
export class AluguelSnapshotModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'aluguel_id', type: 'uuid', unique: true })
    aluguelId: string;

    @OneToOne(() => AluguelModel, { eager: false })
    @JoinColumn({ name: 'aluguel_id' })
    aluguel: AluguelModel;

    @Column(() => SnapshotItemModel, { prefix: false })
    snapshotItem: SnapshotItemModel;

    @Column({
        type: 'text',
        name: 'observacoes_locatario',
        nullable: true,
        comment: 'Observações do locatário (dados raramente consultados)',
    })
    observacoesLocatario?: string;

    @Column({
        type: 'text',
        name: 'motivo_recusa_locador',
        nullable: true,
        comment: 'Motivo de recusa do locador (dados raramente consultados)',
    })
    motivoRecusaLocador?: string;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    static criar(props: Partial<AluguelSnapshotModel>): AluguelSnapshotModel {
        const snapshot = new AluguelSnapshotModel();
        Object.assign(snapshot, {
            criadoEm: new Date(),
            ...props,
        });
        return snapshot;
    }
}
