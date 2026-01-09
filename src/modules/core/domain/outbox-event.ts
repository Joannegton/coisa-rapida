import { StatusOutboxEvent } from '../infra/models/outbox-event.model';

export type EventoOutboxProps = {
    tipoEvento: string;
    idAgregado: string;
    tipoAgregado: string;
    payload: Record<string, any>;
    status: StatusOutboxEvent;
    quantidadeTentativas: number;
    mensagemErro?: string;
    criadoEm: Date;
    publicadoEm?: Date;
};

export class OutboxEvent {
    private readonly _id: string;
    private readonly props: EventoOutboxProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as EventoOutboxProps;
    }

    static criar(props: {
        tipoEvento: string;
        idAgregado: string;
        tipoAgregado: string;
        payload: Record<string, any>;
    }): OutboxEvent {
        const domain = new OutboxEvent();
        domain.setTipoEvento(props.tipoEvento);
        domain.setIdAgregado(props.idAgregado);
        domain.setTipoAgregado(props.tipoAgregado);
        domain.setPayload(props.payload);
        domain.setStatus(StatusOutboxEvent.PENDENTE);
        domain.setQuantidadeTentativas(0);
        domain.setCriadoEm(new Date());
        return domain;
    }

    static carregar(props: EventoOutboxProps, id: string): OutboxEvent {
        const domain = new OutboxEvent(id);
        Object.assign(domain.props, props);
        return domain;
    }

    // Métodos de negócio
    marcarComoPublicado(): void {
        this.setStatus(StatusOutboxEvent.PUBLICADO);
        this.setPublicadoEm(new Date());
    }

    marcarComoFalhou(mensagemErro: string): void {
        this.setStatus(StatusOutboxEvent.FALHADO);
        this.setMensagemErro(mensagemErro);
        this.setQuantidadeTentativas(this.quantidadeTentativas + 1);
    }

    incrementarTentativa(): void {
        this.setQuantidadeTentativas(this.quantidadeTentativas + 1);
    }

    estaPendente(): boolean {
        return this.status === StatusOutboxEvent.PENDENTE;
    }

    atingiuLimiteTentativas(limite: number = 5): boolean {
        return this.quantidadeTentativas >= limite;
    }

    private setTipoEvento(tipoEvento: string): void {
        this.props.tipoEvento = tipoEvento;
    }

    private setIdAgregado(idAgregado: string): void {
        this.props.idAgregado = idAgregado;
    }

    private setTipoAgregado(tipoAgregado: string): void {
        this.props.tipoAgregado = tipoAgregado;
    }

    private setPayload(payload: Record<string, any>): void {
        this.props.payload = payload;
    }

    private setStatus(status: StatusOutboxEvent): void {
        this.props.status = status;
    }

    private setQuantidadeTentativas(quantidadeTentativas: number): void {
        this.props.quantidadeTentativas = quantidadeTentativas;
    }

    private setMensagemErro(mensagemErro?: string): void {
        this.props.mensagemErro = mensagemErro;
    }

    private setCriadoEm(criadoEm: Date): void {
        this.props.criadoEm = criadoEm;
    }

    private setPublicadoEm(publicadoEm?: Date): void {
        this.props.publicadoEm = publicadoEm;
    }

    get id(): string {
        return this._id;
    }

    get tipoEvento(): string {
        return this.props.tipoEvento;
    }

    get idAgregado(): string {
        return this.props.idAgregado;
    }

    get tipoAgregado(): string {
        return this.props.tipoAgregado;
    }

    get payload(): Record<string, any> {
        return this.props.payload;
    }

    get status(): StatusOutboxEvent {
        return this.props.status;
    }

    get quantidadeTentativas(): number {
        return this.props.quantidadeTentativas;
    }

    get mensagemErro(): string | undefined {
        return this.props.mensagemErro;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    get publicadoEm(): Date | undefined {
        return this.props.publicadoEm;
    }
}
