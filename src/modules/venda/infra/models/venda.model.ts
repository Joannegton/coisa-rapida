import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatusPagamento {
  PENDENTE = 'pendente',
  PAGO = 'pago',
  CANCELADO = 'cancelado',
  REEMBOLSADO = 'reembolsado',
}

@Entity({ name: 'vendas', schema: 'vendas' })
@Index('idx_vendas_item_id', ['itemId'])
@Index('idx_vendas_vendedor_id', ['vendedorId'])
@Index('idx_vendas_comprador_id', ['compradorId'])
@Index('idx_vendas_status', ['statusPagamento'])
export class Venda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'item_id' })
  itemId: string;

  @Column({ type: 'text', name: 'item_nome' })
  itemNome: string;

  @Column({ type: 'text', name: 'item_foto_url', nullable: true })
  itemFotoUrl?: string;

  @Column({ type: 'uuid', name: 'vendedor_id' })
  vendedorId: string;

  @Column({ type: 'uuid', name: 'comprador_id' })
  compradorId: string;

  @Column({ length: 255, name: 'vendedor_nome' })
  vendedorNome: string;

  @Column({ length: 255, name: 'comprador_nome' })
  compradorNome: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'snapshot_valor_pago',
  })
  snapshotValorPago: number;

  @Column({ length: 100, name: 'transacao_id', nullable: true })
  transacaoId?: string;

  @Column({ length: 50, name: 'metodo_pagamento' })
  metodoPagamento: string;

  @Column({
    type: 'enum',
    enum: StatusPagamento,
    name: 'status_pagamento',
    default: StatusPagamento.PENDENTE,
  })
  statusPagamento: StatusPagamento;

  @Column({ type: 'timestamptz', name: 'data_pagamento', nullable: true })
  dataPagamento?: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    default: () => 'NOW()',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    default: () => 'NOW()',
  })
  updatedAt: Date;
}
