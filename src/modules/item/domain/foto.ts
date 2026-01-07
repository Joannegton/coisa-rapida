import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

export interface FotoProps {
    publicIdCloudinary: string;
    url: string;
    ordem: number;
    principal: boolean;
    nomeArquivo?: string;
    tamanhoBytes?: number;
    criadoEm: Date;
}

type CriarFotoProps = Omit<FotoProps, 'criadoEm' | 'id'>;

export class Foto {
    private readonly _id: string;
    private readonly props: FotoProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as FotoProps;
    }

    static criar(props: CriarFotoProps): Foto {
        const domain = new Foto();
        domain.setUrl(props.url);
        domain.setOrdem(props.ordem);
        domain.setPrincipal(props.principal);
        domain.setNomeArquivo(props.nomeArquivo);
        domain.setTamanhoBytes(props.tamanhoBytes);
        domain.setPublicIdCloudinary(props.publicIdCloudinary);
        return domain;
    }

    static carregar(props: FotoProps, id: string): Foto {
        const domain = new Foto(id);
        domain.setUrl(props.url);
        domain.setOrdem(props.ordem);
        domain.setPrincipal(props.principal);
        domain.setNomeArquivo(props.nomeArquivo);
        domain.setTamanhoBytes(props.tamanhoBytes);
        domain.setPublicIdCloudinary(props.publicIdCloudinary);
        domain.props.criadoEm = props.criadoEm;
        return domain;
    }

    definirComoPrincipal() {
        this.setPrincipal(true);
    }

    tornarPrincipal(): void {
        this.setPrincipal(true);
    }

    removerPrincipal(): void {
        this.setPrincipal(false);
    }

    mudarOrdem(novaOrdem: number): void {
        if (novaOrdem < 1 || novaOrdem > 3) {
            throw new InvalidPropsException('Ordem deve estar entre 1 e 3');
        }
        this.setOrdem(novaOrdem);
    }

    private setUrl(value: string) {
        this.props.url = value;
    }

    private setOrdem(value: number) {
        this.props.ordem = value;
    }

    private setPrincipal(value: boolean) {
        this.props.principal = value;
    }

    private setNomeArquivo(value?: string) {
        this.props.nomeArquivo = value;
    }

    private setTamanhoBytes(value?: number) {
        this.props.tamanhoBytes = value;
    }

    private setPublicIdCloudinary(value: string) {
        if (!value)
            throw new InvalidPropsException(
                'publicIdCloudinary não pode ser vazio',
            );
        this.props.publicIdCloudinary = value;
    }

    get id(): string {
        return this._id;
    }

    get url(): string {
        return this.props.url;
    }

    get ordem(): number {
        return this.props.ordem;
    }

    get principal(): boolean {
        return this.props.principal;
    }

    get nomeArquivo(): string | undefined {
        return this.props.nomeArquivo;
    }

    get tamanhoBytes(): number | undefined {
        return this.props.tamanhoBytes;
    }

    get publicIdCloudinary(): string | undefined {
        return this.props.publicIdCloudinary;
    }
}
