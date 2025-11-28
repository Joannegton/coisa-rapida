import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { TipoTransferencia, StatusTransferencia } from '../../domain/Transferencia';
import { AluguelModel } from './Aluguel.model';
import { v4 as uuidv4 } from 'uuid';

type TransferenciaModelProps = {
  tipo: TipoTransferencia;
  valor: number;
  contaDestinoId: string;
  nomeDestino: string;
  chavePix?: string;
  status: StatusTransferencia;
  mpTransferenciaId?: number;
  mpRefundId?: number;
  descricao: string;
  instrucoesTransferencia?: string;
  errorMessage?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
  concluidoEm?: Date;
};
@Entity('transferencias')
export class TransferenciaModel extends BaseEntity implements TransferenciaModelProps {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  aluguelId: string;

  @ManyToOne(() => AluguelModel, (aluguel) => aluguel.transferencias, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluguelId' })
  aluguel: AluguelModel;

  @Column({
    type: 'enum',
    enum: TipoTransferencia,
  })
  tipo: TipoTransferencia;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({ type: 'varchar' })
  contaDestinoId: string;

  @Column({ type: 'varchar' })
  nomeDestino: string;

  @Column({ type: 'varchar', nullable: true })
  chavePix?: string;

  @Column({
    type: 'enum',
    enum: StatusTransferencia,
    default: StatusTransferencia.PENDENTE,
  })
  @Index()
  status: StatusTransferencia;

  @Column({ type: 'bigint', nullable: true })
  mpTransferenciaId?: number;

  @Column({ type: 'bigint', nullable: true })
  mpRefundId?: number;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'text', nullable: true })
  instrucoesTransferencia?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  @Column({ type: 'timestamp', nullable: true })
  concluidoEm?: Date;

  static criar(props: Omit<TransferenciaModelProps, 'id' | 'criadoEm' | 'atualizadoEm' | 'concluidoEm'> & { id?: string }): TransferenciaModel {
    const transferencia = new TransferenciaModel();
    transferencia.id = props.id || uuidv4();
    Object.assign(transferencia, props);
    return transferencia;
  }
}
