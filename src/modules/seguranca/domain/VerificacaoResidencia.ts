import { Resultado, ResultadoUtil } from "src/shared/resultado";
import { Usuario } from "./Usuario";
import { Endereco } from "./Endereco";
import { VerificacaoPendenteDto } from "../application/queries/ListarVerificacoesPendentes.usecase";

export enum ModeracaoStatus {
  PENDENTE = 'pendente',
  EM_ANALISE = 'em_analise',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
}

export type VerificacaoResidenciaProps = {
    comprovanteUrl: string;
    tipoComprovante: string;
    status: ModeracaoStatus;
    observacoesUsuario?: string;
    motivoRejeicao?: string;
    dataSubmissao: Date;
    dataConclusao?: Date;
    usuario: Usuario;
    observacoesModerador?: string;
    moderadorId?: string;
};

export type CriarVerificacaoResidenciaProps = {
    comprovanteUrl: string;
    tipoComprovante: string;
    observacoesUsuario?: string;
    usuario: Usuario;
}

type ProcessarAnaliseProps = { 
  status: ModeracaoStatus, 
  moderadorId?: string, 
  motivoRejeicao: string, 
  observacoes?: string 
}

export class VerificacaoResidencia {
  private _id: string;
  private props: VerificacaoResidenciaProps;

  constructor(id?: string) {
    this._id = id || crypto.randomUUID();
    this.props = {} as VerificacaoResidenciaProps;
  }

  static criar(props: CriarVerificacaoResidenciaProps): Resultado<VerificacaoResidencia, Error> {
    const instancia = new VerificacaoResidencia();

    instancia.setUsuario(props.usuario);
    instancia.setComprovanteUrl(props.comprovanteUrl);
    instancia.setTipoComprovante(props.tipoComprovante);
    instancia.setStatus(ModeracaoStatus.PENDENTE);
    instancia.setObservacoesUsuario(props.observacoesUsuario);


    return ResultadoUtil.sucesso(instancia);
  }

  static carregar(props: VerificacaoResidenciaProps, id: string): VerificacaoResidencia {
    const instancia = new VerificacaoResidencia(id);
    instancia.props = props;
    return instancia;
  }

  processarAnalise(props: ProcessarAnaliseProps): void {
    if (this.props.status == ModeracaoStatus.APROVADO) {
      throw new Error('A verificação já foi aprovada');
    }
    if (this.props.status == ModeracaoStatus.REJEITADO) {
      throw new Error('A verificação já foi rejeitada');
    }
    if (props.status === ModeracaoStatus.APROVADO) {
      this.aprovar(props.moderadorId, props.observacoes);
    }
    else if (props.status === ModeracaoStatus.REJEITADO) {
      if (!props.motivoRejeicao) {
        throw new Error('Motivo de rejeição é obrigatório');
      }
      this.rejeitar(props.motivoRejeicao, props.moderadorId, props.observacoes);
    }
  }
  private aprovar(moderadorId?: string, observacoes?: string): void {
    if (this.props.status !== ModeracaoStatus.EM_ANALISE) {
      throw new Error('A verificação deve estar em análise para ser aprovada');
    }
    this.props.status = ModeracaoStatus.APROVADO;
    this.props.moderadorId = moderadorId;
    this.props.observacoesModerador = observacoes;
    this.props.dataConclusao = new Date();
  }

  private rejeitar( motivo: string, moderadorId?: string, observacoes?: string): void {
    if (this.props.status !== ModeracaoStatus.EM_ANALISE) {
      throw new Error('A verificação deve estar em análise para ser rejeitada');
    }
    this.props.status = ModeracaoStatus.REJEITADO;
    this.props.moderadorId = moderadorId;
    this.props.motivoRejeicao = motivo;
    this.props.observacoesModerador = observacoes;
    this.props.dataConclusao = new Date();
  }

  cancelar(): void {
    if (this.props.status === ModeracaoStatus.APROVADO || this.props.status === ModeracaoStatus.REJEITADO) {
      throw new Error('Não é possível cancelar uma verificação já concluída');
    }
    this.props.status = ModeracaoStatus.CANCELADO;
  }

  atualizarObservacoesUsuario(observacoes: string): void {
    this.props.observacoesUsuario = observacoes;
  }

  get id(): string {
    return this._id;
  }

  get usuario(): Usuario {
    return this.props.usuario;
  }

  get comprovanteUrl(): string {
    return this.props.comprovanteUrl;
  }

  get tipoComprovante(): string {
    return this.props.tipoComprovante;
  }

  get status(): ModeracaoStatus {
    return this.props.status;
  }

  get moderadorId(): string | undefined {
    return this.props.moderadorId;
  }

  get observacoesUsuario(): string | undefined {
    return this.props.observacoesUsuario;
  }

  get observacoesModerador(): string | undefined {
    return this.props.observacoesModerador;
  }

  get motivoRejeicao(): string | undefined {
    return this.props.motivoRejeicao;
  }

  get dataSubmissao(): Date {
    return this.props.dataSubmissao;
  }

  get dataConclusao(): Date | undefined {
    return this.props.dataConclusao;
  }

  private setStatus(status: ModeracaoStatus): Resultado<void, Error> {
    if (!Object.values(ModeracaoStatus).includes(status)) {
        return ResultadoUtil.falha(new Error('Status inválido'));
    }
    this.props.status = status;
    return ResultadoUtil.sucesso();
  }

  private setUsuario(usuario: Usuario): Resultado<void, Error> {
    if (!usuario?.id) {
        return ResultadoUtil.falha(new Error('Usuário inválido'));
    }
        
    this.props.usuario = usuario;
    return ResultadoUtil.sucesso();
  }

  private setComprovanteUrl(comprovanteUrl: string): Resultado<void, Error> {
    if (!comprovanteUrl) {
        return ResultadoUtil.falha(new Error('URL do comprovante é obrigatória'));
    }
    this.props.comprovanteUrl = comprovanteUrl;
    return ResultadoUtil.sucesso();
  }

  private setTipoComprovante(tipoComprovante: string): Resultado<void, Error> {
    this.props.tipoComprovante = tipoComprovante;
    return ResultadoUtil.sucesso();
  }

  private setModeradorId(moderadorId?: string): Resultado<void, Error> {
    this.props.moderadorId = moderadorId;
    return ResultadoUtil.sucesso();
  }

  private setObservacoesUsuario(observacoesUsuario?: string): Resultado<void, Error> {
    this.props.observacoesUsuario = observacoesUsuario;
    return ResultadoUtil.sucesso();
  }

  private setObservacoesModerador(observacoesModerador?: string): Resultado<void, Error> {
    this.props.observacoesModerador = observacoesModerador;
    return ResultadoUtil.sucesso();
  }

  private setMotivoRejeicao(motivoRejeicao?: string): Resultado<void, Error> {
    this.props.motivoRejeicao = motivoRejeicao;
    return ResultadoUtil.sucesso();
  }

  private setDataConclusao(dataConclusao: Date): Resultado<void, Error> {
    this.props.dataConclusao = dataConclusao;
    return ResultadoUtil.sucesso();
  }

  toDto(): VerificacaoPendenteDto {
    return {
      id: this.id,
      comprovanteUrl: this.comprovanteUrl,
      tipoComprovante: this.tipoComprovante,
      observacoesUsuario: this.observacoesUsuario,
      dataSubmissao: this.dataSubmissao,
      usuario: {
        id: this.usuario.id,
        nome: this.usuario.nome,
        cpf: this.usuario.cpf,
        email: this.usuario.email,
        telefone: this.usuario.telefone,
        endereco: this.usuario.endereco.toDto(),
      },
    };
  }
}