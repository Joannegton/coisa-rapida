export type AluguelResult = {
    id: string;
    locador: PessoaDto;
    locatario: PessoaDto;
    precoTotal: number;
    precoTotalComTaxa: number;
    dataInicio: Date;
    dataFim: Date;
    status: string;
    observacoesLocatario?: string;
    motivoRecusaLocador?: string;
    criadoEm: Date;
    item: ItemSnapshotDto;
    caucao?: CaucaoDto;
    multa?: {
        valor: number;
        status: string;
    };
};

export type PessoaDto = {
    id: string;
    nome: string;
};

export type ItemSnapshotDto = {
    id: string;
    nome: string;
    descricao?: string;
    precoDiaria: number;
    precoHora?: number;
    fotoUrl?: string;
};

export type CaucaoDto = {
    valor?: number;
    status?: string;
    dataPagamento?: Date;
    dataDevolucao?: Date;
};

export interface AluguelService {
    buscar(aluguelId: string): Promise<AluguelResult | null>;
}
