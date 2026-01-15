import { AluguelPagamentoStatusModel } from 'src/modules/core/infra/models/aluguel-pagamento.value-object';
import { StatusCaucao } from 'src/modules/core/infra/models/caucao.value-object';

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

export type AtualizarPagamentoProps = {
    aluguelId: string;
    status: StatusCaucao | AluguelPagamentoStatusModel;
    dataPagamento?: Date;
    eCaucao: boolean;
};

export interface AluguelService {
    buscar(aluguelId: string): Promise<AluguelResult | null>;
    atualizarPagamento(props: AtualizarPagamentoProps): Promise<void>;
}
