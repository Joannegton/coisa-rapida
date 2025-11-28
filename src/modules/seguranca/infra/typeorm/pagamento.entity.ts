import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  PrimaryColumn,
} from 'typeorm';

export enum PagamentoTipoEnum {
  ALUGUEL = 'aluguel',
  MULTA = 'multa',
  TAXA = 'taxa',
}

export enum PagamentoMetodoEnum {
  CARTAO = 'cartao',
  PIX = 'pix',
  BOLETO = 'boleto',
  TRANSFERENCIA = 'transferencia',
  MERCADO_PAGO = 'mercado_pago',
}

export enum PagamentoStatusEnum {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  CANCELADO = 'cancelado',
  REEMBOLSADO = 'reembolsado',
}

type PagamentoModelProps = {
  id: string;
  tipo: PagamentoTipoEnum;
  aluguel_id?: string | null;
  multa_id?: string | null;
  pagador_id: string;
  recebedor_id: string;
  valor_bruto: number;
  taxa_plataforma?: number;
  taxa_pagamento?: number;
  valor_liquido: number;
  metodo: PagamentoMetodoEnum;
  status: PagamentoStatusEnum;
  gateway_provider?: string | null;
  gateway_transacao_id?: string | null;
  gateway_response?: Record<string, any> | null;
  pix_chave?: string | null;
  pix_qrcode?: string | null;
  boleto_url?: string | null;
  boleto_codigo_barras?: string | null;
  cartao_ultimos_digitos?: string | null;
  cartao_bandeira?: string | null;
  data_vencimento?: Date | null;
  data_pagamento?: Date | null;
  data_compensacao?: Date | null;
  reembolsado?: boolean;
  data_reembolso?: Date | null;
  motivo_reembolso?: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

@Entity('pagamentos')
export class PagamentoModel extends BaseEntity implements PagamentoModelProps {
  @PrimaryColumn('uuid')
  id: string;

  // Tipo e contexto
  @Column({
    type: 'enum',
    enum: PagamentoTipoEnum,
  })
  tipo: PagamentoTipoEnum;

  @Column('uuid', { nullable: true })
  aluguel_id?: string | null;

  @Column('uuid', { nullable: true })
  multa_id?: string | null;

  // Partes envolvidas
  @Column('text')
  pagador_id: string;

  @Column('text')
  recebedor_id: string;

  // Valores
  @Column('decimal', { precision: 10, scale: 2 })
  valor_bruto: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxa_plataforma: number = 0;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxa_pagamento: number = 0;

  @Column('decimal', { precision: 10, scale: 2 })
  valor_liquido: number;

  // Método de pagamento
  @Column({
    type: 'enum',
    enum: PagamentoMetodoEnum,
  })
  metodo: PagamentoMetodoEnum;

  // Status e processamento
  @Column({
    type: 'enum',
    enum: PagamentoStatusEnum,
    default: PagamentoStatusEnum.PENDENTE,
  })
  status: PagamentoStatusEnum = PagamentoStatusEnum.PENDENTE;

  // Integração com gateway
  @Column('varchar', { length: 50, nullable: true })
  gateway_provider: string | null; // 'mercadopago', 'stripe', etc

  @Column('varchar', { length: 255, nullable: true })
  gateway_transacao_id: string | null;

  @Column('jsonb', { nullable: true })
  gateway_response: Record<string, any> | null;

  // Dados do pagamento
  @Column('varchar', { length: 255, nullable: true })
  pix_chave: string | null;

  @Column('text', { nullable: true })
  pix_qrcode: string | null;

  @Column('varchar', { length: 1024, nullable: true })
  boleto_url: string | null;

  @Column('varchar', { length: 255, nullable: true })
  boleto_codigo_barras: string | null;

  @Column('varchar', { length: 4, nullable: true })
  cartao_ultimos_digitos: string | null;

  @Column('varchar', { length: 50, nullable: true })
  cartao_bandeira: string | null;

  // Datas importantes
  @Column('timestamptz', { nullable: true })
  data_vencimento: Date | null;

  @Column('timestamptz', { nullable: true })
  data_pagamento: Date | null;

  @Column('timestamptz', { nullable: true })
  data_compensacao: Date | null;

  // Reembolso
  @Column('boolean', { default: false })
  reembolsado: boolean = false;

  @Column('timestamptz', { nullable: true })
  data_reembolso: Date | null;

  @Column('text', { nullable: true })
  motivo_reembolso: string | null;

  // Metadados
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  static criar(props: Omit<PagamentoModelProps, 'criadoEm' | 'atualizadoEm'>): PagamentoModel {
    const pagamento = new PagamentoModel();
    Object.assign(pagamento, props);
    return pagamento;
  }
}
