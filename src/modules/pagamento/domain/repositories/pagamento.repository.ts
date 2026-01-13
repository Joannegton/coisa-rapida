import { Pagamento } from '../pagamento';

export interface PagamentoRepository {
    salvar(pagamento: Pagamento): Promise<void>;
    buscarPorId(id: string): Promise<Pagamento | null>;
    buscarUltimoPorAluguelId(aluguelId: string): Promise<Pagamento | null>;
}
