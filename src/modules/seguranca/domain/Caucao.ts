export enum StatusCaucao {
  CRIADA = 'criada',
  AGUARDANDO_PAGAMENTO = 'aguardando_pagamento',
  PAGA = 'paga',
  PROCESSANDO = 'processando',
  DEVOLVIDA = 'devolvida',
  CANCELADA = 'cancelada',
}

export class Caucao {
  id: string;
  aluguelId: string;
  paymentId: string;
  valor: number;
  status: StatusCaucao;
  checkoutUrl?: string;
  mpResponse?: any;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Caucao>) {
    Object.assign(this, data);
    this.status = data.status ?? StatusCaucao.CRIADA;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  atualizarStatus(novoStatus: StatusCaucao, mpResponse?: any): void {
    this.status = novoStatus;
    this.updatedAt = new Date();
    
    if (mpResponse) {
      this.mpResponse = mpResponse;
    }
  }

  estaPaga(): boolean {
    return this.status === StatusCaucao.PAGA;
  }

  podeSerProcessada(): boolean {
    return this.status === StatusCaucao.PAGA || this.status === StatusCaucao.PROCESSANDO;
  }
}
