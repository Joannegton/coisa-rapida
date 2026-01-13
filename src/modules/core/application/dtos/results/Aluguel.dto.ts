import { AluguelStatus } from 'src/modules/core/infra/models/aluguel.model';

export class AluguelDto {
    id: string;
    locador: PessoaDto;
    locatario: PessoaDto;
    precoTotal: number;
    precoTotalComTaxa: number;
    dataInicio: Date;
    dataFim: Date;
    status: AluguelStatus;
    observacoesLocatario?: string;
    motivoRecusaLocador?: string;
    criadoEm: Date;

    item: ItemSnapshotDto;
    caucao?: CaucaoDto;
    aluguelPagamento?: AluguelPagamentoDto;
    multa?: {
        valor: number;
        status: string;
    };
}

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
    valorCaucao?: number;
    caucaoObrigatoria: boolean;
};

export type CaucaoDto = {
    valor: number;
    status: string;
    dataPagamento?: Date;
    dataDevolucao?: Date;
};

export type AluguelPagamentoDto = {
    valor?: number;
    status: string;
    dataPagamento?: Date;
};
