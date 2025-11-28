import { Resultado, ResultadoUtil } from "src/shared/resultado";
import { v4 as uuidv4 } from 'uuid';

export enum StatusCaucao {
  CRIADA = 'criada',
  AGUARDANDO_PAGAMENTO = 'aguardando_pagamento',
  PAGA = 'paga',
  PROCESSANDO = 'processando',
  DEVOLVIDA = 'devolvida',
  CANCELADA = 'cancelada',
}

export enum MetodoPagamento {
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  PIX = 'pix',
  BOLETO = 'boleto',
  ACCOUNT_MONEY = 'account_money',
  DESCONHECIDO = 'desconhecido',
}

type CaucaoProps = {
    paymentId: string;
    valor: number;
    status: StatusCaucao;
    metodoPagamento: MetodoPagamento;
    checkoutUrl: string;
    mpResponse?: any;
    criadoEm?: Date;
    atualizadoEm?: Date;
};

type CriarCaucaoProps = {
    paymentId: string;
    valor: number;
    status: StatusCaucao;
    checkoutUrl: string;
    mpResponse?: any;
};

export type CaucaoDto = {
    id: string;
    paymentId: string;
    valor: number;
    status: StatusCaucao;
    metodoPagamento: MetodoPagamento;
    checkoutUrl?: string;
    mpResponse?: any;
    criadoEm: Date;
    atualizadoEm: Date;
};

export class Caucao {
  private _id: string;
  private props: CaucaoProps;

  constructor(id?: string) {
    this._id = id ?? '';
    this.props = {} as CaucaoProps;
  }

  static criar(props: CriarCaucaoProps): Resultado<Caucao, Error> {
    const instancia = new Caucao();
    instancia._id = uuidv4(); // ✅ Gerar ID automaticamente

    const setPaymentId = instancia.setPaymentId(props.paymentId);
    const setValor = instancia.setValor(props.valor);
    const setStatus = instancia.setStatus(props.status);
    const setCheckoutUrl = instancia.setCheckoutUrl(props.checkoutUrl);
    const setMpResponse = instancia.setMpResponse(props.mpResponse);

    return ResultadoUtil.resultados([setPaymentId, setValor, setStatus, setCheckoutUrl, setMpResponse], instancia);
  }

  static carregar(props: CaucaoProps, id: string): Caucao {
    const instancia = new Caucao(id);
    instancia.props = props;
    return instancia;
  }

    atualizarStatus(novoStatus: StatusCaucao, mpResponse?: any): void {
    this.props.status = novoStatus;
    this.props.atualizadoEm = new Date();

    if (mpResponse) {
      this.props.mpResponse = mpResponse;
    }
  }

  definirMetodoPagamento(metodo: MetodoPagamento): void {
    this.props.metodoPagamento = metodo;
    this.props.atualizadoEm = new Date();
  }

  estaPaga(): boolean {
    return this.status === StatusCaucao.PAGA;
  }

  podeSerProcessada(): boolean {
    return this.status === StatusCaucao.PAGA || this.status === StatusCaucao.PROCESSANDO;
  }

  get id(): string {
    return this._id;
  }

  get paymentId(): string {
    return this.props.paymentId;
  }

  get valor(): number {
    return this.props.valor;
  }

  get status(): StatusCaucao {
    return this.props.status;
  }

  get metodoPagamento(): MetodoPagamento {
    return this.props.metodoPagamento;
  }

  get checkoutUrl(): string {
    return this.props.checkoutUrl;
  }

  get mpResponse(): any {
    return this.props.mpResponse;
  }

  get criadoEm(): Date | undefined {
    return this.props.criadoEm;
  }

  get atualizadoEm(): Date | undefined {
    return this.props.atualizadoEm;
  }

  private setPaymentId(paymentId: string): Resultado<void, Error> {
    if (!paymentId) {
      return ResultadoUtil.falha(new Error('Payment ID não pode ser vazio'));
    }
    this.props.paymentId = paymentId;
    return ResultadoUtil.sucesso();
  }

  private setValor(valor: number): Resultado<void, Error> {
    if (valor <= 0) {
      return ResultadoUtil.falha(new Error('Valor da caução deve ser maior que zero'));
    }
    this.props.valor = valor;
    return ResultadoUtil.sucesso();
  }

  private setStatus(status: StatusCaucao): Resultado<void, Error> {
    if (!Object.values(StatusCaucao).includes(status)) {
      return ResultadoUtil.falha(new Error('Status da caução inválido'));
    }
    this.props.status = status;
    return ResultadoUtil.sucesso();
  }

  private setMetodoPagamento(metodo: MetodoPagamento): Resultado<void, Error> {
    if (!Object.values(MetodoPagamento).includes(metodo)) {
      return ResultadoUtil.falha(new Error('Método de pagamento inválido'));
    }
    this.props.metodoPagamento = metodo;
    return ResultadoUtil.sucesso();
  }

  private setCheckoutUrl(checkoutUrl: string): Resultado<void, Error> {
    this.props.checkoutUrl = checkoutUrl;
    return ResultadoUtil.sucesso();
  }

  private setMpResponse(mpResponse?: any): Resultado<void, Error> {
    this.props.mpResponse = mpResponse;
    return ResultadoUtil.sucesso();
  }

  private setCriadoEm(criadoEm: Date): Resultado<void, Error> {
    this.props.criadoEm = criadoEm;
    return ResultadoUtil.sucesso();
  }

  private setAtualizadoEm(atualizadoEm: Date): Resultado<void, Error> {
    this.props.atualizadoEm = atualizadoEm;
    return ResultadoUtil.sucesso();
  }

  toDto(): CaucaoDto {
    return {
      id: this.id,
      paymentId: this.paymentId,
      valor: this.valor,
      status: this.status,
      metodoPagamento: this.metodoPagamento,
      checkoutUrl: this.checkoutUrl,
      mpResponse: this.mpResponse,
      criadoEm: this.criadoEm!,
      atualizadoEm: this.atualizadoEm!,
    };
  }

}
