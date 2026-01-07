export interface FotoProps {
    id: string;
    url: string;
    ordem: number;
    principal: boolean;
    nomeArquivo?: string;
    tamanhoBytes?: number;
    criadoEm: Date;
}

type CriarFotoProps = Omit<FotoProps, 'criadoEm'>;

export class Foto {
    private readonly props: FotoProps;

    constructor(id: string) {
        this.props = { id } as FotoProps;
    }

    static criar(props: CriarFotoProps): Foto {
        const domain = new Foto(props.id);
        domain.setUrl(props.url);
        domain.setOrdem(props.ordem);
        domain.setPrincipal(props.principal);
        domain.setNomeArquivo(props.nomeArquivo);
        domain.setTamanhoBytes(props.tamanhoBytes);
        return domain;
    }

    static carregar(props: FotoProps): Foto {
        const domain = new Foto(props.id);
        domain.setUrl(props.url);
        domain.setOrdem(props.ordem);
        domain.setPrincipal(props.principal);
        domain.setNomeArquivo(props.nomeArquivo);
        domain.setTamanhoBytes(props.tamanhoBytes);
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
            throw new Error('Ordem deve estar entre 1 e 3');
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

    get id(): string {
        return this.props.id;
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
}
