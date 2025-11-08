import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { StatusCaucao } from '../../domain/Caucao';
import { AluguelModel } from './Aluguel.model';

@Entity('caucoes')
export class CaucaoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  aluguelId: string;

  @ManyToOne(() => AluguelModel, { nullable: true })
  @JoinColumn({ name: 'aluguelId' })
  aluguel?: AluguelModel;

  @Column({ type: 'varchar', unique: true })
  @Index()
  paymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({
    type: 'enum',
    enum: StatusCaucao,
    default: StatusCaucao.CRIADA,
  })
  @Index()
  status: StatusCaucao;

  @Column({ type: 'text', nullable: true })
  checkoutUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  mpResponse?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
