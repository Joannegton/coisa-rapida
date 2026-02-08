import { Aluguel } from '../aluguel';
import { StatusCaucao } from '../../infra/models/caucao.value-object';
import { AluguelPagamentoStatusModel } from '../../infra/models/aluguel-pagamento.value-object';

export type AtualizarPagamentoProps = {
    aluguelId: string;
    status: StatusCaucao | AluguelPagamentoStatusModel;
    dataPagamento?: Date;
    eCaucao: boolean;
};

export interface AluguelRepository {
    salvar(aluguel: Aluguel): Promise<Aluguel>;
    buscar(id: string): Promise<Aluguel | null>;
    listarPorUsuario(usuarioId: string): Promise<Aluguel[]>;
    atualizarPagamento(props: AtualizarPagamentoProps): Promise<void>;
}
