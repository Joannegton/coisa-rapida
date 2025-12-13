import {
    ModeracaoStatus,
    TipoComprovante,
} from '../infra/models/comprovante-residencia.model';
import { ComprovanteResidenciaException } from './exceptions/comprovante-residencia.exception';

export type ComprovanteResidenciaProps = {
    usuarioId: string;
    comprovanteUrl: string;
    tipoComprovante: TipoComprovante;
    status: ModeracaoStatus;
    moderadorId?: string;
    observacoesModerador?: string;
    observacoesUsuario?: string;
    motivoRejeicao?: string;
    dataConclusao?: Date;
    criadoEm: Date;
    atualizadoEm: Date;
};

export type CriarComprovanteResidenciaProps = {
    comprovanteUrl: string;
    tipoComprovante: TipoComprovante;
    observacoesUsuario?: string;
    usuarioId: string;
};

export class ComprovanteResidencia {
    private readonly _id: string;
    private props: ComprovanteResidenciaProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as ComprovanteResidenciaProps;
    }

    static criar(
        props: CriarComprovanteResidenciaProps,
    ): ComprovanteResidencia {
        const instancia = new ComprovanteResidencia();

        instancia.setComprovanteUrl(props.comprovanteUrl);
        instancia.setTipoComprovante(props.tipoComprovante);
        instancia.setObservacoesUsuario(props.observacoesUsuario);
        instancia.setUsuarioId(props.usuarioId);
        instancia.setStatus(ModeracaoStatus.EM_ANALISE);

        return instancia;
    }

    static carregar(
        props: ComprovanteResidenciaProps,
        id: string,
    ): ComprovanteResidencia {
        const instancia = new ComprovanteResidencia(id);
        instancia.props = props;
        return instancia;
    }

    aprovarComprovante(): void {
        this.setStatus(ModeracaoStatus.APROVADO);
        this.setDataConclusao(new Date());
    }

    get id(): string {
        return this._id;
    }

    get usuarioId(): string {
        return this.props.usuarioId;
    }

    get comprovanteUrl(): string {
        return this.props.comprovanteUrl;
    }

    get tipoComprovante(): TipoComprovante {
        return this.props.tipoComprovante;
    }

    get status(): ModeracaoStatus {
        return this.props.status;
    }

    get moderadorId(): string | undefined {
        return this.props.moderadorId;
    }

    get observacoesModerador(): string | undefined {
        return this.props.observacoesModerador;
    }

    get observacoesUsuario(): string | undefined {
        return this.props.observacoesUsuario;
    }

    get motivoRejeicao(): string | undefined {
        return this.props.motivoRejeicao;
    }

    get createdAt(): Date {
        return this.props.criadoEm;
    }

    get updatedAt(): Date {
        return this.props.atualizadoEm;
    }

    private setUsuarioId(usuarioId: string): void {
        if (!usuarioId) {
            throw new ComprovanteResidenciaException('UsuárioId é obrigatório');
        }

        this.props.usuarioId = usuarioId;
    }

    private setComprovanteUrl(comprovanteUrl: string): void {
        if (!comprovanteUrl) {
            throw new ComprovanteResidenciaException(
                'URL do comprovante é obrigatória',
            );
        }
        this.props.comprovanteUrl = comprovanteUrl;
    }

    private setTipoComprovante(tipoComprovante: TipoComprovante): void {
        if (!Object.values(TipoComprovante).includes(tipoComprovante)) {
            throw new ComprovanteResidenciaException(
                'Tipo de comprovante inválido',
            );
        }
        this.props.tipoComprovante = tipoComprovante;
    }

    private setStatus(status: ModeracaoStatus): void {
        if (!Object.values(ModeracaoStatus).includes(status)) {
            throw new ComprovanteResidenciaException(
                'Status de moderação inválido',
            );
        }
        this.props.status = status;
    }

    private setModeradorId(moderadorId?: string): void {
        this.props.moderadorId = moderadorId;
    }

    private setObservacoesModerador(observacoesModerador?: string): void {
        this.props.observacoesModerador = observacoesModerador;
    }

    private setObservacoesUsuario(observacoesUsuario?: string): void {
        this.props.observacoesUsuario = observacoesUsuario;
    }

    private setMotivoRejeicao(motivoRejeicao?: string): void {
        this.props.motivoRejeicao = motivoRejeicao;
    }

    private setDataConclusao(dataConclusao?: Date): void {
        this.props.dataConclusao = dataConclusao;
    }

    toDto() {
        return {
            id: this.id,
            comprovanteUrl: this.comprovanteUrl,
            tipoComprovante: this.tipoComprovante,
            observacoesUsuario: this.observacoesUsuario,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            usuarioId: this.usuarioId,
        };
    }
}
