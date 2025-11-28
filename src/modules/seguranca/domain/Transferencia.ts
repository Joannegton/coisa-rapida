import { Resultado, ResultadoUtil } from "src/shared/resultado";
import { v4 as uuidv4 } from 'uuid';

export enum TipoTransferencia {
  PAGAMENTO_LOCADOR = 'pagamento_locador',
  REEMBOLSO_LOCATARIO = 'reembolso_locatario',
  INDENIZACAO = 'indenizacao',
}

export enum StatusTransferencia {
  PENDENTE = 'pendente',
  PROCESSANDO = 'processando',
  AGUARDANDO_TRANSFERENCIA_MANUAL = 'aguardando_transferencia_manual',
  CONCLUIDA = 'concluida',
  FALHOU = 'falhou',
}

type TransferenciaProps = {
  aluguelId: string;
  tipo: TipoTransferencia;
  valor: number;
  contaDestinoId: string;
  nomeDestino: string;
  chavePix?: string;
  status: StatusTransferencia;
  mpTransferenciaId?: number;
  mpRefundId?: number;
  descricao: string;
  instrucoesTransferencia?: string;
  errorMessage?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
  concluidoEm?: Date;
};

export type TransferenciaDto = {
  id: string;
  aluguelId: string;
  tipo: TipoTransferencia;
  valor: number;
  contaDestinoId: string;
  nomeDestino: string;
  chavePix?: string;
  status: StatusTransferencia;
  mpTransferenciaId?: number;
  mpRefundId?: number;
  descricao: string;
  instrucoesTransferencia?: string;
  errorMessage?: string;
  criadoEm: Date;
  atualizadoEm: Date;
  concluidoEm?: Date;
};

export class Transferencia {
  private _id: string;
  private props: TransferenciaProps;

  constructor(id?: string) {
    this._id = id ?? '';
    this.props = {} as TransferenciaProps;
  }

  static criar(props: TransferenciaProps): Resultado<Transferencia, Error> {
    const instancia = new Transferencia();
    instancia._id = uuidv4(); // ✅ Gerar ID automaticamente

    const setAluguelId = instancia.setAluguelId(props.aluguelId);
    const setTipo = instancia.setTipo(props.tipo);
    const setValor = instancia.setValor(props.valor);
    const setContaDestinoId = instancia.setContaDestinoId(props.contaDestinoId);
    const setNomeDestino = instancia.setNomeDestino(props.nomeDestino);
    const setChavePix = instancia.setChavePix(props.chavePix);
    const setStatus = instancia.setStatus(props.status);
    const setDescricao = instancia.setDescricao(props.descricao);
    const setInstrucoesTransferencia = instancia.setInstrucoesTransferencia(props.instrucoesTransferencia);

    return ResultadoUtil.resultados(
      [setAluguelId, setTipo, setValor, setContaDestinoId, setNomeDestino, setChavePix, setStatus, setDescricao, setInstrucoesTransferencia],
      instancia
    );
  }

  static carregar(props: TransferenciaProps, id: string): Transferencia {
    const instancia = new Transferencia(id);
    instancia.props = props;
    return instancia;
  }

  marcarComoProcessando(): void {
    this.props.status = StatusTransferencia.PROCESSANDO;
    this.props.atualizadoEm = new Date();
  }

  marcarComoAguardandoTransferenciaManual(instrucoes: string): void {
    this.props.status = StatusTransferencia.AGUARDANDO_TRANSFERENCIA_MANUAL;
    this.props.instrucoesTransferencia = instrucoes;
    this.props.atualizadoEm = new Date();
  }

  marcarComoConcluida(transferenciaId?: number, refundId?: number): void {
    this.props.status = StatusTransferencia.CONCLUIDA;
    this.props.mpTransferenciaId = transferenciaId;
    this.props.mpRefundId = refundId;
    this.props.concluidoEm = new Date();
    this.props.atualizadoEm = new Date();
  }

  marcarComoFalhou(errorMessage: string): void {
    this.props.status = StatusTransferencia.FALHOU;
    this.props.errorMessage = errorMessage;
    this.props.atualizadoEm = new Date();
  }

  estaConcluida(): boolean {
    return this.props.status === StatusTransferencia.CONCLUIDA;
  }

  podeSerRetentada(): boolean {
    return this.props.status === StatusTransferencia.FALHOU || this.props.status === StatusTransferencia.PENDENTE;
  }

  get id(): string {
    return this._id;
  }

  get aluguelId(): string {
    return this.props.aluguelId;
  }

  get tipo(): TipoTransferencia {
    return this.props.tipo;
  }

  get valor(): number {
    return this.props.valor;
  }

  get contaDestinoId(): string {
    return this.props.contaDestinoId;
  }

  get nomeDestino(): string {
    return this.props.nomeDestino;
  }

  get chavePix(): string | undefined {
    return this.props.chavePix;
  }

  get status(): StatusTransferencia {
    return this.props.status;
  }

  get mpTransferenciaId(): number | undefined {
    return this.props.mpTransferenciaId;
  }

  get mpRefundId(): number | undefined {
    return this.props.mpRefundId;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get instrucoesTransferencia(): string | undefined {
    return this.props.instrucoesTransferencia;
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  get criadoEm(): Date | undefined {
    return this.props.criadoEm;
  }

  get atualizadoEm(): Date | undefined {
    return this.props.atualizadoEm;
  }

  get concluidoEm(): Date | undefined {
    return this.props.concluidoEm;
  }

  private setAluguelId(aluguelId: string): Resultado<void, Error> {
    if (!aluguelId) {
      return ResultadoUtil.falha(new Error('Aluguel ID não pode ser vazio'));
    }
    this.props.aluguelId = aluguelId;
    return ResultadoUtil.sucesso();
  }

  private setTipo(tipo: TipoTransferencia): Resultado<void, Error> {
    if (!Object.values(TipoTransferencia).includes(tipo)) {
      return ResultadoUtil.falha(new Error('Tipo de transferência inválido'));
    }
    this.props.tipo = tipo;
    return ResultadoUtil.sucesso();
  }

  private setValor(valor: number): Resultado<void, Error> {
    if (valor <= 0) {
      return ResultadoUtil.falha(new Error('Valor da transferência deve ser maior que zero'));
    }
    this.props.valor = valor;
    return ResultadoUtil.sucesso();
  }

  private setContaDestinoId(contaDestinoId: string): Resultado<void, Error> {
    if (!contaDestinoId) {
      return ResultadoUtil.falha(new Error('Conta de destino ID não pode ser vazio'));
    }
    this.props.contaDestinoId = contaDestinoId;
    return ResultadoUtil.sucesso();
  }

  private setNomeDestino(nomeDestino: string): Resultado<void, Error> {
    if (!nomeDestino) {
      return ResultadoUtil.falha(new Error('Nome de destino não pode ser vazio'));
    }
    this.props.nomeDestino = nomeDestino;
    return ResultadoUtil.sucesso();
  }

  private setChavePix(chavePix?: string): Resultado<void, Error> {
    this.props.chavePix = chavePix;
    return ResultadoUtil.sucesso();
  }

  private setStatus(status: StatusTransferencia): Resultado<void, Error> {
    if (!Object.values(StatusTransferencia).includes(status)) {
      return ResultadoUtil.falha(new Error('Status de transferência inválido'));
    }
    this.props.status = status;
    return ResultadoUtil.sucesso();
  }

  private setDescricao(descricao: string): Resultado<void, Error> {
    if (!descricao) {
      return ResultadoUtil.falha(new Error('Descrição não pode ser vazia'));
    }
    this.props.descricao = descricao;
    return ResultadoUtil.sucesso();
  }

  private setInstrucoesTransferencia(instrucoesTransferencia?: string): Resultado<void, Error> {
    this.props.instrucoesTransferencia = instrucoesTransferencia;
    return ResultadoUtil.sucesso();
  }

  private setMpTransferenciaId(mpTransferenciaId?: number): Resultado<void, Error> {
    this.props.mpTransferenciaId = mpTransferenciaId;
    return ResultadoUtil.sucesso();
  }

  private setMpRefundId(mpRefundId?: number): Resultado<void, Error> {
    this.props.mpRefundId = mpRefundId;
    return ResultadoUtil.sucesso();
  }

  private setErrorMessage(errorMessage?: string): Resultado<void, Error> {
    this.props.errorMessage = errorMessage;
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

  private setConcluidoEm(concluidoEm?: Date): Resultado<void, Error> {
    this.props.concluidoEm = concluidoEm;
    return ResultadoUtil.sucesso();
  }

  toDto(): TransferenciaDto {
    return {
      id: this.id,
      aluguelId: this.aluguelId,
      tipo: this.tipo,
      valor: this.valor,
      contaDestinoId: this.contaDestinoId,
      nomeDestino: this.nomeDestino,
      chavePix: this.chavePix,
      status: this.status,
      mpTransferenciaId: this.mpTransferenciaId,
      mpRefundId: this.mpRefundId,
      descricao: this.descricao,
      instrucoesTransferencia: this.instrucoesTransferencia,
      errorMessage: this.errorMessage,
      criadoEm: this.criadoEm!,
      atualizadoEm: this.atualizadoEm!,
      concluidoEm: this.concluidoEm,
    };
  }
}
