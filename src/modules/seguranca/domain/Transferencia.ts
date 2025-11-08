export enum TipoTransferencia {
  PAGAMENTO_LOCADOR = 'pagamento_locador',
  REEMBOLSO_LOCATARIO = 'reembolso_locatario',
  INDENIZACAO = 'indenizacao',
}

export enum StatusTransferencia {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  CONCLUIDA = 'concluida',
  FALHOU = 'falhou',
}

export class Transferencia {
  id: string;
  aluguelId: string;
  tipo: TipoTransferencia;
  valor: number;
  contaDestinoId: string;
  nomeDestino: string;
  status: StatusTransferencia;
  mpTransferenciaId?: number;
  mpRefundId?: number;
  descricao: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  constructor(data: Partial<Transferencia>) {
    Object.assign(this, data);
    this.status = data.status ?? StatusTransferencia.PENDENTE;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  marcarComoProcessando(): void {
    this.status = StatusTransferencia.PROCESSANDO;
    this.updatedAt = new Date();
  }

  marcarComoConcluida(transferenciaId?: number, refundId?: number): void {
    this.status = StatusTransferencia.CONCLUIDA;
    this.mpTransferenciaId = transferenciaId;
    this.mpRefundId = refundId;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  marcarComoFalhou(errorMessage: string): void {
    this.status = StatusTransferencia.FALHOU;
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
  }

  estaConcluida(): boolean {
    return this.status === StatusTransferencia.CONCLUIDA;
  }

  podeSerRetentada(): boolean {
    return this.status === StatusTransferencia.FALHOU || this.status === StatusTransferencia.PENDENTE;
  }
}
