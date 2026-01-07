import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { PrecoException } from './exceptions/preco.exception';

export interface PrecosProps {
    precoPorDia: number;
    precoPorHora?: number;
    valorCaucao?: number;
    caucaoObrigatoria: boolean;
}

export type AtualizarPrecosProps = Partial<PrecosProps>;

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

    atualizar(props: AtualizarPrecosProps): void {
        if (props.precoPorDia !== undefined) {
            this.setPrecoPorDia(props.precoPorDia);
        }
        if (props.precoPorHora !== undefined) {
            this.setPrecoPorHora(props.precoPorHora);
        }
        if (props.valorCaucao !== undefined) {
            // Validar caução mínima se estiver atualizando
            const caucaoMinima = this.calcularCaucaoMinima();
            if (props.valorCaucao < caucaoMinima) {
                throw new PrecoException(
                    `valor do Caução deve ser no mínimo ${caucaoMinima}`,
                );
            }
            this.setValorCaucao(props.valorCaucao);
        }
        if (props.caucaoObrigatoria !== undefined) {
            this.setCaucaoObrigatoria(props.caucaoObrigatoria);
        }
    }

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
