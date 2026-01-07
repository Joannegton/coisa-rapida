import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { CaucaoModel } from './caucao.value-object';
import { MultaModel } from './multa.value-object';
import { ContratoModel } from './contrato.value-object';
import { PessoaModel } from './pessoa.value-object';
import { AluguelSnapshotModel } from './aluguel-snapshot.model';

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

    @Column(() => PessoaModel, { prefix: 'locador' })
    locador: PessoaModel;

    @Column(() => PessoaModel, { prefix: 'locatario' })
    locatario: PessoaModel;

    @Column({ name: 'item_id', type: 'uuid' })
    itemId: string;

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
    multa: MultaModel;

    @Column(() => ContratoModel, { prefix: false })
    contrato: ContratoModel;

    @Column({ type: 'timestamptz', name: 'data_inicio' })
    dataInicio: Date;

    @Column({ type: 'timestamptz', name: 'data_fim' })
    dataFim: Date;

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

    @OneToOne(() => AluguelSnapshotModel, (snapshot) => snapshot.aluguel, {
        cascade: true,
        eager: false,
    })
    snapshot: AluguelSnapshotModel;
}
