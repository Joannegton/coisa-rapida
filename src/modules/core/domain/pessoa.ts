import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

export type PessoaProps = {
    id: string;
    nome: string;
};

export class Pessoa {
    private readonly props: PessoaProps;

    constructor() {
        this.props = {} as PessoaProps;
    }

    static criar(props: PessoaProps): Pessoa {
        const pessoa = new Pessoa();
        pessoa.setId(props.id);
        pessoa.setNome(props.nome);
        return pessoa;
    }

    private setId(id: string): void {
        if (!id) throw new InvalidPropsException('ID da pessoa é obrigatório.');
        this.props.id = id;
    }

    private setNome(nome: string): void {
        if (!nome || nome.trim().length === 0)
            throw new InvalidPropsException('Nome da pessoa é obrigatório.');
        this.props.nome = nome;
    }

    get id(): string {
        return this.props.id;
    }

    get nome(): string {
        return this.props.nome;
    }
}
