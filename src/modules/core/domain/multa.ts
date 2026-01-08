import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

export type MultaProps = {
    diasAtraso?: number;
    multiplicador?: number;
    valorDiariaSnapshot?: number;
    valorTotal?: number;
    calculadaEm?: Date;
};

export type CriarMultaProps = Omit<MultaProps, 'valorTotal' | 'calculadaEm'>;

export class Multa {
    private readonly props: MultaProps;

    constructor() {
        this.props = {} as MultaProps;
    }

    static criar(props: CriarMultaProps): Multa {
        const domain = new Multa();
        domain.setDiasAtraso(props.diasAtraso);
        domain.setMultiplicador(props.multiplicador);
        domain.setValorDiariaSnapshot(props.valorDiariaSnapshot);
        domain.calcularValorTotal();
        return domain;
    }

    static carregar(props: MultaProps): Multa {
        const domain = new Multa();
        domain.setDiasAtraso(props.diasAtraso);
        domain.setMultiplicador(props.multiplicador);
        domain.setValorDiariaSnapshot(props.valorDiariaSnapshot);
        domain.setCalculadaEm(props.calculadaEm);
        domain.setValorTotal(props.valorTotal);
        return domain;
    }

    temAtraso(): boolean {
        return (this.props.diasAtraso ?? 0) > 0;
    }

    eAtrasosCritico(): boolean {
        return (this.props.diasAtraso ?? 0) >= 5;
    }

    /**
     * Calcular valor total da multa
     * Fórmula: multiplicador × valor_diaria × dias_atraso
     */
    private calcularValorTotal(): void {
        const valorCalculado =
            this.props.multiplicador! *
            this.props.valorDiariaSnapshot! *
            this.props.diasAtraso!;

        this.props.valorTotal = Math.round(valorCalculado * 100) / 100;
        this.setCalculadaEm(new Date());
    }

    recalcular(diasAtraso: number): void {
        this.setDiasAtraso(diasAtraso);
        this.calcularValorTotal();
    }

    private setDiasAtraso(dias?: number) {
        if (dias !== undefined && dias < 0)
            throw new InvalidPropsException(
                'Dias de atraso não pode ser negativo.',
            );
        if (dias !== undefined && dias > 30)
            throw new InvalidPropsException(
                'Atraso máximo de 30 dias. Acima disso deve ser tratado como disputa.',
            );
        this.props.diasAtraso = dias;
    }

    private setMultiplicador(multiplicador?: number) {
        if (multiplicador !== undefined && multiplicador <= 0)
            throw new InvalidPropsException(
                'Multiplicador deve ser maior que zero.',
            );
        if (multiplicador !== undefined && multiplicador > 5)
            throw new InvalidPropsException(
                'Multiplicador máximo é 5x (500% do valor diário).',
            );
        this.props.multiplicador = multiplicador;
    }

    private setValorDiariaSnapshot(valor?: number) {
        if (valor !== undefined && valor <= 0)
            throw new InvalidPropsException(
                'Valor da diária deve ser maior que zero.',
            );
        this.props.valorDiariaSnapshot = valor;
    }

    private setCalculadaEm(data?: Date) {
        if (data && data > new Date())
            throw new InvalidPropsException(
                'Data de cálculo não pode ser no futuro.',
            );
        this.props.calculadaEm = data;
    }

    private setValorTotal(valor?: number) {
        if (valor !== undefined && valor < 0)
            throw new InvalidPropsException(
                'Valor total da multa não pode ser negativo.',
            );
        this.props.valorTotal = valor;
    }

    // Getters
    get diasAtraso(): number | undefined {
        return this.props.diasAtraso;
    }

    get multiplicador(): number | undefined {
        return this.props.multiplicador;
    }

    get valorDiariaSnapshot(): number | undefined {
        return this.props.valorDiariaSnapshot;
    }

    get valorTotal(): number | undefined {
        return this.props.valorTotal;
    }

    get calculadaEm(): Date | undefined {
        return this.props.calculadaEm;
    }
}
