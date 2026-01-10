import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

export type AceiteContratoProps = {
    assinaturaDigital: string;
    dataHora: Date;
    enderecoIp: string;
    userAgent: string;
    latitude?: number;
    longitude?: number;
};

export type ContratoProps = {
    id?: string;
    versao: number;
    aceiteLocatario?: AceiteContratoProps;
    aceiteLocador?: AceiteContratoProps;
    criadoEm?: Date;
};

export class Contrato {
    private readonly props: ContratoProps;
    constructor() {
        this.props = {} as ContratoProps;
    }

    static criar(): Contrato {
        const domain = new Contrato();
        domain.setVersao(1);
        domain.setCriadoEm(new Date());
        return domain;
    }

    static carregar(props: ContratoProps): Contrato {
        const domain = new Contrato();
        Object.assign(domain.props, props);
        return domain;
    }

    private setVersao(versao: number) {
        if (versao <= this.props.versao)
            throw new InvalidPropsException(
                'A versão do contrato deve ser maior que a atual.',
            );
        this.props.versao = versao;
    }

    private setAceiteLocador(aceite?: AceiteContratoProps) {
        this.props.aceiteLocador = aceite;
    }

    private setAceiteLocatario(aceite?: AceiteContratoProps) {
        this.props.aceiteLocatario = aceite;
    }

    private setCriadoEm(data: Date) {
        this.props.criadoEm = data;
    }

    get versao(): number {
        return this.props.versao;
    }

    get aceiteLocador(): AceiteContratoProps | undefined {
        return this.props.aceiteLocador;
    }

    get aceiteLocatario(): AceiteContratoProps | undefined {
        return this.props.aceiteLocatario;
    }

    get criadoEm(): Date | undefined {
        return this.props.criadoEm;
    }

    get id(): string | undefined {
        return this.props.id;
    }

    toDto() {
        return {
            id: this.props.id,
            versao: this.props.versao,
            aceiteLocador: this.props.aceiteLocador,
            aceiteLocatario: this.props.aceiteLocatario,
            criadoEm: this.props.criadoEm,
        };
    }
}
