import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CaucaoStatus {
  BLOQUEADA = 'bloqueada',
  LIBERADA = 'liberada',
  RETIDA = 'retida',
  REEMBOLSADA = 'reembolsada',
}

@Entity({ name: 'caucoes', schema: 'pagamentos' })
@Index('idx_caucoes_aluguel_id', ['aluguelId'])
@Index('idx_caucoes_status', ['status'])
@Index('idx_caucoes_transacao_id', ['transacaoId'])
export class Caucao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'aluguel_id' })
  aluguelId: string;

  // mudar para enum quando precisar
  @Column({ length: 50, name: 'metodo_pagamento' })
  metodoPagamento: string;

  @Column({ length: 100, name: 'transacao_id', nullable: true })
  transacaoId?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'valor',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  valor: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'valor_retido',
    default: 0.0,
  })
  valorRetido: number;

  @Column({
    type: 'enum',
    enum: CaucaoStatus,
    name: 'status',
    default: CaucaoStatus.BLOQUEADA,
  })
  status: CaucaoStatus;

  @Column({ type: 'text', name: 'motivo_retencao', nullable: true })
  motivoRetencao?: string;

  @Column({ type: 'timestamptz', name: 'data_liberacao', nullable: true })
  dataLiberacao?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
