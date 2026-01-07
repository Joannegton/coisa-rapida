import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { StatusCaucao } from '../infra/models/caucao.value-object';

export type CaucaoProps = {
    valor: number;
    status: StatusCaucao;
    dataPagamento?: Date;
    dataDevolucao?: Date;
};

export type CriarCaucaoProps = Omit<
    CaucaoProps,
    'status' | 'dataPagamento' | 'dataDevolucao'
>;

export class Caucao {
    private readonly props: CaucaoProps;

    constructor() {
        this.props = {} as CaucaoProps;
    }

    static criar(props: CriarCaucaoProps): Caucao {
        const domain = new Caucao();
        domain.setValor(props.valor);
        domain.setStatus(StatusCaucao.AGUARDANDO_PAGAMENTO);
        return domain;
    }

    static carregar(props: CaucaoProps): Caucao {
        const domain = new Caucao();
        domain.setValor(props.valor);
        domain.setStatus(props.status);
        domain.setDataPagamento(props.dataPagamento);
        domain.setDataDevolucao(props.dataDevolucao);
        return domain;
    }

    confirmarPagamento(): void {
        if (this.props.status !== StatusCaucao.AGUARDANDO_PAGAMENTO)
            throw new InvalidPropsException(
                'Apenas caucões aguardando pagamento podem ser confirmadas.',
            );
        this.setStatus(StatusCaucao.PAGA);
        this.setDataPagamento(new Date());
    }

    iniciarProcessamento(): void {
        if (this.props.status !== StatusCaucao.PAGA)
            throw new InvalidPropsException(
                'Apenas caucões pagas podem ser processadas para devolução.',
            );
        this.setStatus(StatusCaucao.PROCESSANDO);
    }

    confirmarDevolucao(): void {
        if (this.props.status !== StatusCaucao.PROCESSANDO)
            throw new InvalidPropsException(
                'Apenas caucões em processamento podem ser devolvidas.',
            );
        this.setStatus(StatusCaucao.DEVOLVIDA);
        this.setDataDevolucao(new Date());
    }

    cancelar(): void {
        if (this.props.status === StatusCaucao.DEVOLVIDA)
            throw new InvalidPropsException(
                'Caucão já devolvida não pode ser cancelada.',
            );
        this.setStatus(StatusCaucao.CANCELADA);
    }

    estaPaga(): boolean {
        return this.props.status === StatusCaucao.PAGA;
    }

    estaDevolvida(): boolean {
        return this.props.status === StatusCaucao.DEVOLVIDA;
    }

    estaCancelada(): boolean {
        return this.props.status === StatusCaucao.CANCELADA;
    }

    private setValor(valor: number) {
        if (valor <= 0)
            throw new InvalidPropsException(
                'O valor da caução deve ser maior que zero.',
            );
        this.props.valor = valor;
    }

    private setStatus(status: StatusCaucao) {
        if (!Object.values(StatusCaucao).includes(status))
            throw new InvalidPropsException('Status da caução inválido.');
        this.props.status = status;
    }

    private setDataPagamento(data?: Date) {
        if (data && data > new Date())
            throw new InvalidPropsException(
                'Data de pagamento não pode ser no futuro.',
            );
        this.props.dataPagamento = data;
    }

    private setDataDevolucao(data?: Date) {
        if (data && data > new Date())
            throw new InvalidPropsException(
                'Data de devolução não pode ser no futuro.',
            );
        if (this.props.dataPagamento && data && data < this.props.dataPagamento)
            throw new InvalidPropsException(
                'Data de devolução não pode ser anterior à data de pagamento.',
            );
        this.props.dataDevolucao = data;
    }

    // Getters
    get valor(): number {
        return this.props.valor;
    }

    get status(): StatusCaucao {
        return this.props.status;
    }

    get dataPagamento(): Date | undefined {
        return this.props.dataPagamento;
    }

    get dataDevolucao(): Date | undefined {
        return this.props.dataDevolucao;
    }
}
