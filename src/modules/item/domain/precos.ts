import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { PrecoException } from './exceptions/preco.exception';

export interface PrecosProps {
    precoPorDia: number;
    precoPorHora?: number;
    valorCaucao?: number;
    caucaoObrigatoria: boolean;
}

export class Preco {
    private readonly props: PrecosProps;

    constructor() {
        this.props = {} as PrecosProps;
    }

    static criar(props: PrecosProps): Preco {
        const domain = new Preco();
        domain.setPrecoPorDia(props.precoPorDia);
        domain.setPrecoPorHora(props.precoPorHora);

        const calcaoMinimo = domain.calcularCaucaoMinima();
        if (
            props.valorCaucao !== undefined &&
            props.valorCaucao < calcaoMinimo
        ) {
            throw new PrecoException(
                `valor do Caução deve ser no mínimo ${calcaoMinimo}`,
            );
        }
        domain.setValorCaucao(props.valorCaucao);
        domain.setCaucaoObrigatoria(props.caucaoObrigatoria);
        return domain;
    }

    static carregar(props: PrecosProps): Preco {
        const domain = new Preco();
        domain.setPrecoPorDia(props.precoPorDia);
        domain.setPrecoPorHora(props.precoPorHora);
        domain.setValorCaucao(props.valorCaucao);
        domain.setCaucaoObrigatoria(props.caucaoObrigatoria);
        return domain;
    }

    // calcularValorPeriodo(
    //     dataInicio: Date,
    //     dataFim: Date,
    //     permiteHora: boolean,
    // ): number {
    //     const dataMs = dataFim.getTime() - dataInicio.getTime();
    //     if (dataMs <= 0) return 0;

    //     if (permiteHora && this.precoPorHora !== undefined) {
    //         const horas = Math.ceil(dataMs / (1000 * 60 * 60));
    //         return horas * this.precoPorHora;
    //     }

    //     const dias = Math.ceil(dataMs / (1000 * 60 * 60 * 24));
    //     return dias * this.precoPorDia;
    // }

    private calcularCaucaoMinima(): number {
        const taxa = this.precoPorDia * 0.5;
        return this.precoPorDia + taxa;
    }

    private setPrecoPorDia(value: number) {
        if (value === undefined || value === null)
            throw new InvalidPropsException('precoPorDia é obrigatório');
        if (value <= 0)
            throw new InvalidPropsException(
                'precoPorDia não pode ser negativo ou zero',
            );
        this.props.precoPorDia = value;
    }

    private setPrecoPorHora(value?: number) {
        if (value !== undefined && value !== null && value <= 0) {
            throw new InvalidPropsException(
                'precoPorHora não pode ser negativo ou zero',
            );
        }
        this.props.precoPorHora = value;
    }

    private setValorCaucao(value?: number) {
        if (value !== undefined && value !== null && value <= 0) {
            throw new InvalidPropsException(
                'valorCaucao não pode ser negativo ou zero',
            );
        }
        this.props.valorCaucao = value;
    }

    private setCaucaoObrigatoria(value: boolean) {
        if (value === undefined || value === null)
            throw new InvalidPropsException('caucaoObrigatoria é obrigatório');
        this.props.caucaoObrigatoria = value;
    }

    get precoPorDia(): number {
        return this.props.precoPorDia;
    }

    get precoPorHora(): number | undefined {
        return this.props.precoPorHora;
    }

    get valorCaucao(): number | undefined {
        return this.props.valorCaucao;
    }

    get caucaoObrigatoria(): boolean {
        return this.props.caucaoObrigatoria;
    }
}
