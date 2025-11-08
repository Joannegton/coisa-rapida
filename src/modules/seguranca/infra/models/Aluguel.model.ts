import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { StatusAluguel } from '../../domain/Aluguel';

@Entity('alugueis')
export class AluguelModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  item: {
    id: string;
    nome: string;
    descricao?: string;
  };

  @Column({ type: 'jsonb' })
  locatario: {
    id: string;
    nome: string;
    email: string;
    contaMPId?: string;
  };

  @Column({ type: 'jsonb' })
  locador: {
    id: string;
    nome: string;
    email: string;
    contaMPId?: string;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorCaucao: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valorAluguel: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.1 })
  taxaAppPercentual: number;

  @Column({
    type: 'enum',
    enum: StatusAluguel,
    default: StatusAluguel.AGUARDANDO_CAUCAO,
  })
  @Index()
  status: StatusAluguel;

  @Column({ type: 'varchar', nullable: true })
  mpPaymentId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  indenizacao?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finalizadoAt?: Date;
}
