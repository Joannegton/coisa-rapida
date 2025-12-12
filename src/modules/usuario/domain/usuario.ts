import { UsuarioException } from './usuario.exception';

type UsuarioProps = {
    nome: string;
    cpf?: string;
    telefone?: string;
    telefoneVerificado: boolean;
    emailVerificado: boolean;
    verificado: boolean;
    fotoUrl?: string;
    criadoEm?: Date;
    atualizadoEm?: Date;

    endereco?: any;
    comprovanteResidencia?: any;
};

export class Usuario {
    private readonly _id: string;
    private readonly props: UsuarioProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as UsuarioProps;
    }

    static criar(nome: string): Usuario {
        const domain = new Usuario();
        domain.setNome(nome);
        domain.setTelefoneVerificado(false);
        domain.setEmailVerificado(false);
        domain.setVerificado(false);

        return domain;
    }

    static carregar(props: UsuarioProps, id: string): Usuario {
        const domain = new Usuario(id);
        domain.props.nome = props.nome;
        domain.props.cpf = props.cpf;
        domain.props.telefone = props.telefone;
        domain.props.telefoneVerificado = props.telefoneVerificado;
        domain.props.emailVerificado = props.emailVerificado;
        domain.props.verificado = props.verificado;
        domain.props.fotoUrl = props.fotoUrl;
        domain.props.criadoEm = props.criadoEm;
        domain.props.atualizadoEm = props.atualizadoEm;
        domain.props.endereco = props.endereco;
        domain.props.comprovanteResidencia = props.comprovanteResidencia;
        return domain;
    }

    get id(): string {
        return this._id;
    }

    get nome(): string {
        return this.props.nome;
    }

    get cpf(): string | undefined {
        return this.props.cpf;
    }

    get telefone(): string | undefined {
        return this.props.telefone;
    }

    get telefoneVerificado(): boolean {
        return this.props.telefoneVerificado;
    }

    get emailVerificado(): boolean {
        return this.props.emailVerificado;
    }

    get verificado(): boolean {
        return this.props.verificado;
    }

    get fotoUrl(): string | undefined {
        return this.props.fotoUrl;
    }

    get criadoEm(): Date | undefined {
        return this.props.criadoEm;
    }

    get atualizadoEm(): Date | undefined {
        return this.props.atualizadoEm;
    }

    get endereco(): any {
        return this.props.endereco;
    }

    get comprovanteResidencia(): any {
        return this.props.comprovanteResidencia;
    }

    private setNome(nome: string): void {
        if (!nome || nome.trim() === '')
            throw new UsuarioException('Nome é obrigatório');

        this.props.nome = nome;
    }

    private setCpf(cpf?: string): void {
        if (cpf) this.props.cpf = cpf;
    }

    private setTelefone(telefone?: string): void {
        if (telefone) this.props.telefone = telefone;
    }

    private setTelefoneVerificado(telefoneVerificado: boolean): void {
        this.props.telefoneVerificado = telefoneVerificado;
    }

    private setEmailVerificado(emailVerificado: boolean): void {
        this.props.emailVerificado = emailVerificado;
    }

    private setVerificado(verificado: boolean): void {
        this.props.verificado = verificado;
    }

    private setFotoUrl(fotoUrl?: string): void {
        if (fotoUrl) this.props.fotoUrl = fotoUrl;
    }

    private setEndereco(endereco: any): void {
        this.props.endereco = endereco;
    }

    private setComprovanteResidencia(comprovanteResidencia: any): void {
        this.props.comprovanteResidencia = comprovanteResidencia;
    }
}
