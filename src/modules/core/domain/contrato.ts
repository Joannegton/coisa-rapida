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
    versao: number;
    conteudoHtml: string;
    aceiteLocatario?: AceiteContratoProps;
    aceiteLocador?: AceiteContratoProps;
    criadoEm: Date;
};

export type CriarContratoProps = Omit<ContratoProps, 'versao' | 'criadoEm'>;

export class Contrato {
    private readonly props: ContratoProps;
    constructor() {
        this.props = {} as ContratoProps;
    }

    static criar(props: CriarContratoProps): Contrato {
        const domain = new Contrato();
        domain.setVersao(1);
        domain.setConteudoHtml(props.conteudoHtml);
        domain.setAceiteLocador(props.aceiteLocador);
        domain.setAceiteLocatario(props.aceiteLocatario);
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

    private setConteudoHtml(conteudoHtml: string) {
        if (!conteudoHtml || conteudoHtml.trim().length === 0)
            throw new InvalidPropsException(
                'O conteúdo do contrato não pode ser vazio.',
            );
        this.props.conteudoHtml = conteudoHtml;
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

    get conteudoHtml(): string {
        return this.props.conteudoHtml;
    }

    get aceiteLocador(): AceiteContratoProps | undefined {
        return this.props.aceiteLocador;
    }

    get aceiteLocatario(): AceiteContratoProps | undefined {
        return this.props.aceiteLocatario;
    }

    get criadoEm(): Date {
        return this.props.criadoEm;
    }

    toDto() {
        return {
            versao: this.props.versao,
            conteudoHtml: this.props.conteudoHtml,
            aceiteLocador: this.props.aceiteLocador,
            aceiteLocatario: this.props.aceiteLocatario,
            criadoEm: this.props.criadoEm,
        };
    }
}
