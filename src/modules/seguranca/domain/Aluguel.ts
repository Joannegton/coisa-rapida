export enum StatusAluguel {
  AGUARDANDO_CAUCAO = 'aguardando_caucao',
  CAUCAO_PAGA = 'caucao_paga',
  EM_ANDAMENTO = 'em_andamento',
  FINALIZADO_SEM_DANOS = 'finalizado_sem_danos',
  FINALIZADO_COM_DANOS = 'finalizado_com_danos',
  CANCELADO = 'cancelado',
}

export interface ItemAluguel {
  id: string;
  nome: string;
  descricao?: string;
}

export interface ParticipanteAluguel {
  id: string;
  nome: string;
  email: string;
  contaMPId?: string;
}

export class Aluguel {
  id: string;
  item: ItemAluguel;
  locatario: ParticipanteAluguel;
  locador: ParticipanteAluguel;
  valorCaucao: number;
  valorAluguel: number;
  taxaAppPercentual: number;
  status: StatusAluguel;
  mpPaymentId?: string;
  indenizacao?: number;
  createdAt: Date;
  finalizadoAt?: Date;

  constructor(data: Partial<Aluguel>) {
    Object.assign(this, data);
    this.taxaAppPercentual = data.taxaAppPercentual ?? 0.1;
    this.status = data.status ?? StatusAluguel.AGUARDANDO_CAUCAO;
    this.createdAt = data.createdAt ?? new Date();
  }

  calcularTaxaApp(): number {
    return this.valorAluguel * this.taxaAppPercentual;
  }

  calcularValorLiquidoLocador(): number {
    return this.valorAluguel - this.calcularTaxaApp();
  }

  calcularRetornoLocatario(indenizacao: number = 0): number {
    return this.valorCaucao - this.valorAluguel - indenizacao;
  }

  podeSerFinalizado(): boolean {
    return this.status === StatusAluguel.CAUCAO_PAGA || this.status === StatusAluguel.EM_ANDAMENTO;
  }

  marcarComoFinalizado(houveDano: boolean, indenizacao?: number): void {
    if (!this.podeSerFinalizado()) {
      throw new Error('Aluguel não pode ser finalizado neste status');
    }

    if (houveDano) {
      this.status = StatusAluguel.FINALIZADO_COM_DANOS;
      this.indenizacao = indenizacao ?? 0;
    } else {
      this.status = StatusAluguel.FINALIZADO_SEM_DANOS;
      this.indenizacao = 0;
    }

    this.finalizadoAt = new Date();
  }

  atualizarStatusPagamento(mpPaymentId: string): void {
    this.mpPaymentId = mpPaymentId;
    this.status = StatusAluguel.CAUCAO_PAGA;
  }
}
