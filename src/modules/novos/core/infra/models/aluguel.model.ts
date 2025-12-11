import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

@Entity('aluguel')
@Index(['itemId'])
@Index(['locadorId'])
@Index(['locatarioId'])
@Index(['status', 'createdAt'])
@Index(['dataInicio', 'dataFim'])
export class AluguelModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'locador_id', type: 'uuid' })
  locadorId: string;

  @Column({ name: 'locatario_id', type: 'uuid' })
  locatarioId: string;

  @Column({ length: 255, name: 'locador_nome' })
  locadorNome: string;

  @Column({ length: 255, name: 'locatario_nome' })
  locatarioNome: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ type: 'text', name: 'snapshot_item_nome' })
  snapshotItemNome: string;

  @Column({ type: 'text', name: 'snapshot_item_foto_url', nullable: true })
  snapshotItemFotoUrl?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'snapshot_preco_diaria',
  })
  snapshotPrecoDiaria: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'preco_total',
  })
  precoTotal: number;

  @Column({ type: 'timestamptz', name: 'data_inicio' })
  dataInicio: Date;

  @Column({ type: 'timestamptz', name: 'data_fim', nullable: true })
  dataFim?: Date;

  @Column({
    type: 'enum',
    enum: AluguelStatus,
    name: 'status',
    default: AluguelStatus.SOLICITADO,
  })
  status: AluguelStatus;

  @Column({ type: 'text', name: 'observacoes_locatario', nullable: true })
  observacoesLocatario?: string;

  @Column({ type: 'text', name: 'motivo_recusa_locador', nullable: true })
  motivoRecusaLocador?: string;

  @Column({
    type: 'uuid',
    array: true,
    name: 'participantes',
    default: () => 'ARRAY[]::uuid[]',
  })
  participantes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
