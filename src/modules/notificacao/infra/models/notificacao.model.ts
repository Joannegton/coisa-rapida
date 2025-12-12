// modulos/notificacoes/infra/banco-de-dados/entidades/notificacao.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TipoNotificacao {
  NOVA_SOLICITACAO_ALUGUEL = 'nova_solicitacao_aluguel',
  ALUGUEL_CONFIRMADO = 'aluguel_confirmado',
  PAGAMENTO_RECEBIDO = 'pagamento_recebido',
  ITEM_DEVOLVIDO = 'item_devolvido',
  AVALIACAO_PENDENTE = 'avaliacao_pendente',
  DISPUTA_ABERTA = 'disputa_aberta',
}

@Entity('notificacoes', { schema: 'notificacao' })
@Index(['destinatarioId', 'lida', 'createdAt'])
@Index(['tipo', 'createdAt'])
export class NotificacaoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'destinatario_id', type: 'uuid', nullable: false })
  destinatarioId: string;

  @Column({ name: 'aluguel_id', type: 'uuid', nullable: true })
  aluguelId?: string;

  @Column({ name: 'titulo', type: 'varchar', length: 200, nullable: false })
  titulo: string;

  @Column({ name: 'mensagem', type: 'text', nullable: false })
  mensagem: string;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: TipoNotificacao,
    nullable: false,
  })
  tipo: TipoNotificacao;

  @Column({ name: 'lida', type: 'boolean', default: false })
  lida: boolean;

  @Column({ name: 'data_leitura', type: 'timestamp', nullable: true })
  dataLeitura?: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: {
    rota?: string;
    itemNome?: string;
    locatarioNome?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
