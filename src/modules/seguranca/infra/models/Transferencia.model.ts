import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TipoTransferencia, StatusTransferencia } from '../../domain/Transferencia';
import { AluguelModel } from './Aluguel.model';

@Entity('transferencias')
export class TransferenciaModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  aluguelId: string;

  @ManyToOne(() => AluguelModel, { nullable: true })
  @JoinColumn({ name: 'aluguelId' })
  aluguel?: AluguelModel;

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
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
