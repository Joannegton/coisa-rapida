import { UsuarioException } from './exceptions/usuario.exception';
import { Endereco } from './Endereco';
import { ComprovanteResidencia } from './ComprovanteResidencia';
import { ModeracaoStatus } from '../infra/models/comprovante-residencia.model';

type UsuarioProps = {
    usuarioAuthId: string;
    nome: string;
    cpf?: string;
    telefone?: string;
    telefoneVerificado: boolean;
    emailVerificado: boolean;
    verificado: boolean;
    fotoUrl?: string;
    criadoEm?: Date;
    atualizadoEm?: Date;

    endereco?: Endereco;
    comprovantesResidencia?: ComprovanteResidencia[];
};

export class Usuario {
    private readonly _id: string;
    private readonly props: UsuarioProps;

    constructor(id?: string) {
        if (id) this._id = id;
        this.props = {} as UsuarioProps;
    }

    static carregar(props: UsuarioProps, id: string): Usuario {
        const domain = new Usuario(id);
        domain.props.usuarioAuthId = props.usuarioAuthId;
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
        domain.props.comprovantesResidencia = props.comprovantesResidencia;
        return domain;
    }

    verificarTelefone(telefone: string): void {
        this.setTelefone(telefone);
        this.setTelefoneVerificado(true);
        this.verificarUsuario();
    }

    verificarEmail(): void {
        this.setEmailVerificado(true);
        this.verificarUsuario();
    }

    aprovarComprovanteResidencia(): void {
        if (
            !this.props.comprovantesResidencia ||
            this.props.comprovantesResidencia.length === 0
        )
            throw new UsuarioException(
                'Usuário não possui comprovante de residência',
            );
        this.props.comprovantesResidencia.forEach((comprovante) => {
            if (
                comprovante.status === ModeracaoStatus.EM_ANALISE ||
                comprovante.status === ModeracaoStatus.PENDENTE
            ) {
                comprovante.aprovarComprovante();
            }
        });
        this.verificarUsuario();
    }

    verificarUsuario(): void {
        if (this.props.verificado) return;

        if (
            this.props.emailVerificado &&
            this.props.telefoneVerificado &&
            this.props.cpf &&
            this.props.cpf.trim() !== '' &&
            this.props.comprovantesResidencia?.some(
                (c) => c.status === ModeracaoStatus.APROVADO,
            )
        )
            this.setVerificado(true);
    }

    definirEndereco(endereco: Endereco): void {
        if (!endereco) throw new UsuarioException('Endereço é obrigatório');
        this.setEndereco(endereco);
        console.log(this.props.comprovantesResidencia);

        if (this.props.comprovantesResidencia)
            this.props.comprovantesResidencia.forEach((comprovante) =>
                comprovante.revogarComprovante(
                    'Endereço alterado pelo usuário',
                ),
            );

        this.setVerificado(false);
    }

    get id(): string {
        return this._id;
    }

    get usuarioAuthId(): string {
        return this.props.usuarioAuthId;
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

    get endereco(): Endereco | undefined {
        return this.props.endereco;
    }

    get comprovantesResidencia(): ComprovanteResidencia[] | undefined {
        return this.props.comprovantesResidencia;
    }

    private setNome(nome: string): void {
        if (!nome || nome.trim() === '')
            throw new UsuarioException('Nome é obrigatório');

        this.props.nome = nome;
    }

    private setCpf(cpf?: string): void {
        if (cpf) this.props.cpf = cpf;
    }

    private setTelefone(telefone: string): void {
        if (!telefone || telefone.trim() === '')
            throw new UsuarioException('Telefone é obrigatório');

        this.props.telefone = telefone;
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

    private setEndereco(endereco: Endereco): void {
        this.props.endereco = endereco;
    }

    private setComprovantesResidencia(
        comprovantesResidencia: ComprovanteResidencia[] | undefined,
    ): void {
        this.props.comprovantesResidencia = comprovantesResidencia;
    }
}
