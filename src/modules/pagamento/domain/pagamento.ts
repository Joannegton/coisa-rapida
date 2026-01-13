import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import {
    StatusPagamento,
    PagamentoTipo,
} from '../infra/models/pagamento.model';
import { PagamentoException } from './exceptions/pagamento.exception';

export type PagamentoProps = {
    aluguelId: string;
    usuarioId: string;
    tipo: PagamentoTipo;
    mercadoPagoPagamentoId?: string;
    mercadoPagoPreferenciaId?: string;
    valor: number;
    status: StatusPagamento;
    metodoPagamento: string;
    dadosMercadoPago?: Record<string, any>;
    motivoRejeicao?: string;
    criadoEm: Date;
    atualizadoEm: Date;
    aprovadoEm?: Date;
};

export type CriarPagamentoProps = {
    aluguelId: string;
    usuarioId: string;
    tipo: PagamentoTipo;
    mercadoPagoPagamentoId?: string;
    mercadoPagoPreferenciaId?: string;
    valor: number;
    metodoPagamento: string;
    dadosMercadoPago?: Record<string, any>;
};

export class Pagamento {
    private readonly _id: string;
    private readonly props: PagamentoProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as PagamentoProps;
    }

    static criar(props: CriarPagamentoProps): Pagamento {
        const domain = new Pagamento();
        domain.setAluguelId(props.aluguelId);
        domain.setUsuarioId(props.usuarioId);
        domain.setTipo(props.tipo);
        domain.setMercadoPagoPreferenciaId(props.mercadoPagoPreferenciaId);
        domain.setValor(props.valor);
        domain.setStatus(StatusPagamento.PENDENTE);
        domain.setMetodoPagamento(props.metodoPagamento);
        domain.setDadosMercadoPago(props.dadosMercadoPago);
        return domain;
    }

    static carregar(props: PagamentoProps, id: string): Pagamento {
        const domain = new Pagamento(id);
        Object.assign(domain.props, props);
        return domain;
    }

    aprovar(mercadoPagoPagamentoId: string): void {
        if (this.status !== StatusPagamento.PENDENTE) {
            throw new PagamentoException(
                `Apenas pagamentos pendentes podem ser aprovados. Status atual: ${this.status}`,
            );
        }

        this.setMercadoPagoPagamentoId(mercadoPagoPagamentoId);
        this.setStatus(StatusPagamento.APROVADO);
        this.setAprovadoEm(new Date());
    }

    rejeitar(motivo: string): void {
        if (
            this.status !== StatusPagamento.PENDENTE &&
            this.status !== StatusPagamento.EM_PROCESSAMENTO
        ) {
            throw new PagamentoException(
                `Pagamento não pode ser rejeitado do status ${this.status}`,
            );
        }

        if (!motivo || motivo.trim().length === 0) {
            throw new InvalidPropsException(
                'Motivo da rejeição é obrigatório.',
            );
        }

        this.setStatus(StatusPagamento.REJEITADO);
        this.setMotivoRejeicao(motivo);
        this.setAtualizadoEm(new Date());
    }

    processar(): void {
        if (this.status !== StatusPagamento.PENDENTE) {
            throw new PagamentoException(
                `Apenas pagamentos pendentes podem ser processados. Status atual: ${this.status}`,
            );
        }

        this.setStatus(StatusPagamento.EM_PROCESSAMENTO);
        this.setAtualizadoEm(new Date());
    }

    cancelar(): void {
        if (
            this.status === StatusPagamento.APROVADO ||
            this.status === StatusPagamento.REEMBOLSADO ||
            this.status === StatusPagamento.CANCELADO
        ) {
            throw new PagamentoException(
                `Pagamento não pode ser cancelado do status ${this.status}`,
            );
        }

        this.setStatus(StatusPagamento.CANCELADO);
        this.setAtualizadoEm(new Date());
    }

    reembolsar(): void {
        if (this.status !== StatusPagamento.APROVADO) {
            throw new PagamentoException(
                `Apenas pagamentos aprovados podem ser reembolsados. Status atual: ${this.status}`,
            );
        }

        this.setStatus(StatusPagamento.REEMBOLSADO);
        this.setAtualizadoEm(new Date());
    }

    foiAprovado(): boolean {
        return this.status === StatusPagamento.APROVADO;
    }

    foiRejeitado(): boolean {
        return this.status === StatusPagamento.REJEITADO;
    }

    estaEmProcessamento(): boolean {
        return this.status === StatusPagamento.EM_PROCESSAMENTO;
    }

    foiReembolsado(): boolean {
        return this.status === StatusPagamento.REEMBOLSADO;
    }

    estaPendente(): boolean {
        return this.status === StatusPagamento.PENDENTE;
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

    private setTipo(tipo: PagamentoTipo): void {
        if (!Object.values(PagamentoTipo).includes(tipo)) {
            throw new InvalidPropsException('Tipo de pagamento inválido.');
        }
        this.props.tipo = tipo;
    }

    private setMercadoPagoPagamentoId(mercadoPagoPagamentoId: string): void {
        if (!mercadoPagoPagamentoId) {
            throw new InvalidPropsException(
                'Mercado Pago Pagamento ID é obrigatório.',
            );
        }
        this.props.mercadoPagoPagamentoId = mercadoPagoPagamentoId;
    }

    private setMercadoPagoPreferenciaId(
        mercadoPagoPreferenciaId?: string,
    ): void {
        this.props.mercadoPagoPreferenciaId = mercadoPagoPreferenciaId;
    }

    private setValor(valor: number): void {
        if (valor <= 0) {
            throw new InvalidPropsException(
                'Valor do pagamento deve ser maior que zero.',
            );
        }
        this.props.valor = valor;
    }

    private setStatus(status: StatusPagamento): void {
        if (!Object.values(StatusPagamento).includes(status)) {
            throw new InvalidPropsException('Status do pagamento inválido.');
        }
        this.props.status = status;
    }

    private setMetodoPagamento(metodoPagamento: string): void {
        if (!metodoPagamento || metodoPagamento.trim().length === 0) {
            throw new InvalidPropsException(
                'Método de pagamento é obrigatório.',
            );
        }
        this.props.metodoPagamento = metodoPagamento;
    }

    private setDadosMercadoPago(dadosMercadoPago?: Record<string, any>): void {
        this.props.dadosMercadoPago = dadosMercadoPago;
    }

    private setMotivoRejeicao(motivoRejeicao?: string): void {
        this.props.motivoRejeicao = motivoRejeicao;
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

    private setAprovadoEm(aprovadoEm?: Date): void {
        this.props.aprovadoEm = aprovadoEm;
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

    get tipo(): PagamentoTipo {
        return this.props.tipo;
    }

    get mercadoPagoPagamentoId(): string | undefined {
        return this.props.mercadoPagoPagamentoId;
    }

    get mercadoPagoPreferenciaId(): string | undefined {
        return this.props.mercadoPagoPreferenciaId;
    }

    get valor(): number {
        return this.props.valor;
    }

    get status(): StatusPagamento {
        return this.props.status;
    }

    get metodoPagamento(): string {
        return this.props.metodoPagamento;
    }

    get dadosMercadoPago(): Record<string, any> | undefined {
        return this.props.dadosMercadoPago;
    }

    get motivoRejeicao(): string | undefined {
        return this.props.motivoRejeicao;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    get atualizadoEm(): Date {
        return this.props.atualizadoEm;
    }

    get aprovadoEm(): Date | undefined {
        return this.props.aprovadoEm;
    }

    toDto() {
        return {
            id: this._id,
            aluguelId: this.props.aluguelId,
            usuarioId: this.props.usuarioId,
            tipo: this.props.tipo,
            mercadoPagoPagamentoId: this.props.mercadoPagoPagamentoId,
            mercadoPagoPreferenciaId: this.props.mercadoPagoPreferenciaId,
            valor: this.props.valor,
            status: this.props.status,
            metodoPagamento: this.props.metodoPagamento,
            motivoRejeicao: this.props.motivoRejeicao,
            criadoEm: this.props.criadoEm,
            atualizadoEm: this.props.atualizadoEm,
            aprovadoEm: this.props.aprovadoEm,
        };
    }
}
