import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AluguelModel } from './aluguel.model';

@Entity({ name: 'multas', schema: 'transacoes' })
@Index('idx_multas_aluguel_id', ['aluguelId'])
export class Multa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', name: 'dias_atraso', default: 0 })
  diasAtraso: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    name: 'multiplicador',
    default: 1.5,
  })
  multiplicador: number; // 1.5x, 2.0x, etc

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valor_diaria' })
  snapshotValorDiaria: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'valor_multa',
    default: 0,
  })
  valorMulta: number;

  @OneToOne(() => AluguelModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'aluguel_id' })
  aluguel: AluguelModel;

  @Column()
  calculadaEm: Date;

  @CreateDateColumn()
  createdAt: Date;
}
