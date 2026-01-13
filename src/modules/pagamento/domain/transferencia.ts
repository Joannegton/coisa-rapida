import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import {
    TipoTransferencia,
    StatusTransferencia,
} from '../infra/models/transferencia.model';
import { TransferenciaException } from './exceptions/transferencia.exception';

export type TransferenciaProps = {
    aluguelId: string;
    usuarioId: string;
    tipo: TipoTransferencia;
    valor: number;
    status: StatusTransferencia;
    mercadoPagoTransfId?: string;
    descricao: string;
    motivoFalha?: string;
    criadoEm: Date;
    atualizadoEm: Date;
    completadoEm?: Date;
};

export type CriarTransferenciaProps = {
    aluguelId: string;
    usuarioId: string;
    tipo: TipoTransferencia;
    valor: number;
    descricao: string;
    mercadoPagoTransfId?: string;
};

export type ProcessarTransferenciaProps = {
    usuarioId: string;
    mercadoPagoTransfId: string;
};

export type FinalizarTransferenciaProps = {
    usuarioId: string;
    completadoEm?: Date;
};

export type FailarTransferenciaProps = {
    usuarioId: string;
    motivoFalha: string;
};

export class Transferencia {
    private readonly _id: string;
    private readonly props: TransferenciaProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as TransferenciaProps;
    }

    static criar(props: CriarTransferenciaProps): Transferencia {
        const domain = new Transferencia();
        domain.setAluguelId(props.aluguelId);
        domain.setUsuarioId(props.usuarioId);
        domain.setTipo(props.tipo);
        domain.setValor(props.valor);
        domain.setStatus(StatusTransferencia.PENDENTE);
        domain.setDescricao(props.descricao);
        domain.setMercadoPagoTransfId(props.mercadoPagoTransfId);
        return domain;
    }

    static carregar(props: TransferenciaProps, id: string): Transferencia {
        const domain = new Transferencia(id);
        Object.assign(domain.props, props);
        return domain;
    }

    processar(props: ProcessarTransferenciaProps): void {
        if (this.status !== StatusTransferencia.PENDENTE) {
            throw new TransferenciaException(
                `Apenas transferências pendentes podem ser processadas. Status atual: ${this.status}`,
            );
        }

        this.setStatus(StatusTransferencia.PROCESSANDO);
        this.setMercadoPagoTransfId(props.mercadoPagoTransfId);
        this.setAtualizadoEm(new Date());
    }

    solicitarTransferenciaDireta(): void {
        if (this.status !== StatusTransferencia.PROCESSANDO) {
            throw new TransferenciaException(
                `Apenas transferências em processamento podem aguardar transferência manual. Status atual: ${this.status}`,
            );
        }

        this.setStatus(StatusTransferencia.AGUARDANDO_TRANSFERENCIA_MANUAL);
        this.setAtualizadoEm(new Date());
    }

    finalizar(props: FinalizarTransferenciaProps): void {
        if (
            this.status !== StatusTransferencia.PROCESSANDO &&
            this.status !== StatusTransferencia.AGUARDANDO_TRANSFERENCIA_MANUAL
        ) {
            throw new TransferenciaException(
                `Transferência não pode ser finalizada do status ${this.status}`,
            );
        }

        this.setStatus(StatusTransferencia.CONCLUIDA);
        this.setCompleadoEm(props.completadoEm ?? new Date());
        this.setAtualizadoEm(new Date());
    }

    falhar(props: FailarTransferenciaProps): void {
        if (
            this.status === StatusTransferencia.CONCLUIDA ||
            this.status === StatusTransferencia.FALHOU
        ) {
            throw new TransferenciaException(
                `Transferência não pode falhar do status ${this.status}`,
            );
        }

        if (!props.motivoFalha || props.motivoFalha.trim().length === 0) {
            throw new InvalidPropsException('Motivo da falha é obrigatório.');
        }

        this.setStatus(StatusTransferencia.FALHOU);
        this.setMotivoFalha(props.motivoFalha);
        this.setAtualizadoEm(new Date());
    }

    temAutorizacaoDo(usuarioId: string): boolean {
        return this.usuarioId === usuarioId;
    }

    foiConcluida(): boolean {
        return this.status === StatusTransferencia.CONCLUIDA;
    }

    falhou(): boolean {
        return this.status === StatusTransferencia.FALHOU;
    }

    estaEmProcessamento(): boolean {
        return this.status === StatusTransferencia.PROCESSANDO;
    }

    estaAguardandoTransferencia(): boolean {
        return (
            this.status === StatusTransferencia.AGUARDANDO_TRANSFERENCIA_MANUAL
        );
    }

    estaPendente(): boolean {
        return this.status === StatusTransferencia.PENDENTE;
    }

    podeSerReprocessada(): boolean {
        return (
            this.status === StatusTransferencia.FALHOU ||
            this.status === StatusTransferencia.PENDENTE
        );
    }

    private setAluguelId(aluguelId: string): void {
        if (!aluguelId)
            throw new InvalidPropsException('Aluguel ID é obrigatório.');
        this.props.aluguelId = aluguelId;
    }

    private setUsuarioId(usuarioId: string): void {
        if (!usuarioId)
            throw new InvalidPropsException('Usuário ID é obrigatório.');
        this.props.usuarioId = usuarioId;
    }

    private setTipo(tipo: TipoTransferencia): void {
        if (!Object.values(TipoTransferencia).includes(tipo)) {
            throw new InvalidPropsException('Tipo de transferência inválido.');
        }
        this.props.tipo = tipo;
    }

    private setValor(valor: number): void {
        if (valor <= 0) {
            throw new InvalidPropsException(
                'Valor da transferência deve ser maior que zero.',
            );
        }
        this.props.valor = valor;
    }

    private setStatus(status: StatusTransferencia): void {
        if (!Object.values(StatusTransferencia).includes(status)) {
            throw new InvalidPropsException(
                'Status da transferência inválido.',
            );
        }
        this.props.status = status;
    }

    private setDescricao(descricao: string): void {
        if (!descricao || descricao.trim().length === 0) {
            throw new InvalidPropsException(
                'Descrição da transferência é obrigatória.',
            );
        }
        this.props.descricao = descricao;
    }

    private setMercadoPagoTransfId(mercadoPagoTransfId?: string): void {
        this.props.mercadoPagoTransfId = mercadoPagoTransfId;
    }

    private setMotivoFalha(motivoFalha?: string): void {
        this.props.motivoFalha = motivoFalha;
    }

    private setcriadoEm(criadoEm: Date): void {
        if (!criadoEm)
            throw new InvalidPropsException('Data de criação é obrigatória.');
        this.props.criadoEm = criadoEm;
    }

    private setAtualizadoEm(atualizadoEm: Date): void {
        if (!atualizadoEm)
            throw new InvalidPropsException(
                'Data de atualização é obrigatória.',
            );
        this.props.atualizadoEm = atualizadoEm;
    }

    private setCompleadoEm(completadoEm?: Date): void {
        this.props.completadoEm = completadoEm;
    }

    get id(): string {
        return this._id;
    }

    get aluguelId(): string {
        return this.props.aluguelId;
    }

    get usuarioId(): string {
        return this.props.usuarioId;
    }

    get tipo(): TipoTransferencia {
        return this.props.tipo;
    }

    get valor(): number {
        return this.props.valor;
    }

    get status(): StatusTransferencia {
        return this.props.status;
    }

    get mercadoPagoTransfId(): string | undefined {
        return this.props.mercadoPagoTransfId;
    }

    get descricao(): string {
        return this.props.descricao;
    }

    get motivoFalha(): string | undefined {
        return this.props.motivoFalha;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    get atualizadoEm(): Date {
        return this.props.atualizadoEm;
    }

    get completadoEm(): Date | undefined {
        return this.props.completadoEm;
    }

    toDto() {
        return {
            id: this._id,
            aluguelId: this.props.aluguelId,
            usuarioId: this.props.usuarioId,
            tipo: this.props.tipo,
            valor: this.props.valor,
            status: this.props.status,
            mercadoPagoTransfId: this.props.mercadoPagoTransfId,
            descricao: this.props.descricao,
            motivoFalha: this.props.motivoFalha,
            criadoEm: this.props.criadoEm,
            atualizadoEm: this.props.atualizadoEm,
            completadoEm: this.props.completadoEm,
        };
    }
}
