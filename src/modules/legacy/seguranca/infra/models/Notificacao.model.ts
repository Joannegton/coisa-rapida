import { Entity, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryColumn } from 'typeorm';

export enum TipoNotificacao {
  // Aluguel
  ALUGUEL_SOLICITADO = 'aluguel_solicitado',
  ALUGUEL_APROVADO = 'aluguel_aprovado',
  ALUGUEL_RECUSADO = 'aluguel_recusado',
  ALUGUEL_CANCELADO = 'aluguel_cancelado',
  ALUGUEL_INICIADO = 'aluguel_iniciado',
  ALUGUEL_FINALIZADO = 'aluguel_finalizado',
  ALUGUEL_PROXIMO_INICIO = 'aluguel_proximo_inicio',
  ALUGUEL_PROXIMO_FIM = 'aluguel_proximo_fim',
  ALUGUEL_ATRASADO = 'aluguel_atrasado',

  // Pagamento
  PAGAMENTO_PENDENTE = 'pagamento_pendente',
  PAGAMENTO_CONFIRMADO = 'pagamento_confirmado',
  PAGAMENTO_FALHOU = 'pagamento_falhou',
  REEMBOLSO_PROCESSADO = 'reembolso_processado',

  // Caução
  CAUCAO_BLOQUEADA = 'caucao_bloqueada',
  CAUCAO_LIBERADA = 'caucao_liberada',
  CAUCAO_RETIDA = 'caucao_retida',

  // Chat
  NOVA_MENSAGEM = 'nova_mensagem',

  // Avaliação
  NOVA_AVALIACAO = 'nova_avaliacao',
  RESPOSTA_AVALIACAO = 'resposta_avaliacao',

  // Problemas
  PROBLEMA_REPORTADO = 'problema_reportado',
  PROBLEMA_RESOLVIDO = 'problema_resolvido',

  // Sistema
  VERIFICACAO_PENDENTE = 'verificacao_pendente',
  VERIFICACAO_APROVADA = 'verificacao_aprovada',
  VERIFICACAO_REJEITADA = 'verificacao_rejeitada',
  CONTA_SUSPENSA = 'conta_suspensa',
  CONTA_REATIVADA = 'conta_reativada',

  // Outros
  LEMBRETE = 'lembrete',
  SISTEMA = 'sistema',
}

export enum PrioridadeNotificacao {
  BAIXA = 'baixa',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

@Entity('notificacoes')
export class Notificacao {
  @PrimaryColumn('uuid')
  id: string;

  // Destinatário
  @Column({ name: 'destinatario_id' })
  destinatarioId: string;

  // Tipo e conteúdo
  @Column({
    type: 'enum',
    enum: TipoNotificacao,
  })
  tipo: TipoNotificacao;

  @Column({
    type: 'enum',
    enum: PrioridadeNotificacao,
    default: PrioridadeNotificacao.NORMAL,
  })
  prioridade: PrioridadeNotificacao;

  @Column()
  titulo: string;

  @Column('text')
  mensagem: string;

  // Ação (deep link ou URL)
  @Column({ name: 'acao_url', nullable: true })
  acaoUrl?: string;

  @Column({ name: 'acao_tipo', nullable: true })
  acaoTipo?: string;

  @Column({ name: 'acao_id', nullable: true })
  acaoId?: string;

  // Contexto
  @Column({ name: 'aluguel_id', nullable: true })
  aluguelId?: string;

  @Column({ name: 'item_id', nullable: true })
  itemId?: string;

  @Column({ name: 'remetente_id', nullable: true })
  remetenteId?: string;

  // Dados adicionais
  @Column('jsonb', { nullable: true })
  dados?: any;

  // Status
  @Column({ default: false })
  lida: boolean;

  @Column({ name: 'data_leitura', type: 'timestamp', nullable: true })
  dataLeitura?: Date;

  @Column({ name: 'enviada_push', default: false })
  enviadaPush: boolean;

  @Column({ name: 'enviada_email', default: false })
  enviadaEmail: boolean;

  // Agendamento
  @Column({ default: false })
  agendada: boolean;

  @Column({ name: 'data_agendamento', type: 'timestamp', nullable: true })
  dataAgendamento?: Date;

  // Expiração
  @Column({ name: 'expira_em', type: 'timestamp', nullable: true })
  expiraEm?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
