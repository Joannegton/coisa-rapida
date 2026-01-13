import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { AluguelPagamentoStatusModel } from '../infra/models/aluguel-pagamento.value-object';

export type AluguelPagamentoProps = {
    valor?: number;
    status: AluguelPagamentoStatusModel;
    dataPagamento?: Date;
};

export type CriarAluguelPagamentoProps = Omit<
    AluguelPagamentoProps,
    'status' | 'dataPagamento'
> & { valor: number };

export class AluguelPagamento {
    private readonly props: AluguelPagamentoProps;

    constructor() {
        this.props = {} as AluguelPagamentoProps;
    }

    static criar(props: CriarAluguelPagamentoProps): AluguelPagamento {
        const domain = new AluguelPagamento();
        domain.setValor(props.valor);
        domain.setStatus(AluguelPagamentoStatusModel.AGUARDANDO_PAGAMENTO);
        return domain;
    }

    static carregar(props: AluguelPagamentoProps): AluguelPagamento {
        const domain = new AluguelPagamento();
        Object.assign(domain.props, props);
        return domain;
    }

    confirmarPagamento(): void {
        if (
            this.props.status !==
            AluguelPagamentoStatusModel.AGUARDANDO_PAGAMENTO
        )
            throw new InvalidPropsException(
                'Apenas pagamentos aguardando podem ser confirmados.',
            );
        this.setStatus(AluguelPagamentoStatusModel.PAGO);
        this.setDataPagamento(new Date());
    }

    iniciarProcessamento(): void {
        if (
            this.props.status ===
            AluguelPagamentoStatusModel.AGUARDANDO_PAGAMENTO
        ) {
            this.setStatus(AluguelPagamentoStatusModel.PROCESSANDO);
        } else {
            throw new InvalidPropsException(
                'Apenas pagamentos aguardando podem ser marcados como processando.',
            );
        }
    }

    recusar(): void {
        if (
            this.props.status === AluguelPagamentoStatusModel.PAGO ||
            this.props.status === AluguelPagamentoStatusModel.CANCELADO
        ) {
            throw new InvalidPropsException(
                'Pagamentos já pagos ou cancelados não podem ser recusados.',
            );
        }
        this.setStatus(AluguelPagamentoStatusModel.RECUSADO);
    }

    cancelar(): void {
        if (this.props.status === AluguelPagamentoStatusModel.PAGO) {
            throw new InvalidPropsException(
                'Pagamentos já pagos não podem ser cancelados.',
            );
        }
        this.setStatus(AluguelPagamentoStatusModel.CANCELADO);
    }

    estaPago(): boolean {
        return this.props.status === AluguelPagamentoStatusModel.PAGO;
    }

    estaProcessando(): boolean {
        return this.props.status === AluguelPagamentoStatusModel.PROCESSANDO;
    }

    foiRecusado(): boolean {
        return this.props.status === AluguelPagamentoStatusModel.RECUSADO;
    }

    estaCancelado(): boolean {
        return this.props.status === AluguelPagamentoStatusModel.CANCELADO;
    }

    estaAguardando(): boolean {
        return (
            this.props.status ===
            AluguelPagamentoStatusModel.AGUARDANDO_PAGAMENTO
        );
    }

    private setValor(valor: number): void {
        if (valor <= 0)
            throw new InvalidPropsException(
                'O valor do pagamento do aluguel deve ser maior que zero.',
            );
        this.props.valor = valor;
    }

    private setStatus(status: AluguelPagamentoStatusModel): void {
        if (!Object.values(AluguelPagamentoStatusModel).includes(status))
            throw new InvalidPropsException(
                'Status do pagamento do aluguel inválido.',
            );
        this.props.status = status;
    }

    private setDataPagamento(data?: Date): void {
        if (data && data > new Date())
            throw new InvalidPropsException(
                'Data de pagamento não pode ser no futuro.',
            );
        this.props.dataPagamento = data;
    }

    // Getters
    get valor(): number | undefined {
        return this.props.valor;
    }

    get status(): AluguelPagamentoStatusModel {
        return this.props.status;
    }

    get dataPagamento(): Date | undefined {
        return this.props.dataPagamento;
    }

    toDto() {
        return {
            valor: this.props.valor,
            status: this.props.status,
            dataPagamento: this.props.dataPagamento,
        };
    }
}
