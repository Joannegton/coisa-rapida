import { Aluguel } from '../aluguel';

export interface AluguelRepository {
    salvar(aluguel: Aluguel): Promise<void>;
    buscar(id: string): Promise<Aluguel | null>;
}
