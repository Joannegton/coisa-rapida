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
