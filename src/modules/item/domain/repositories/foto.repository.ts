import { Foto } from '../foto';

export interface FotoRepository {
    salvar(fotos: Foto[]): Promise<Foto[]>;
    tornarPrincipal(fotoId: string, itemId: string): Promise<void>;
    recalcularOrdem(itemId: string): Promise<void>;
    remover(id: string): Promise<void>;
    atualizarOrdem(
        atualizacoes: { id: string; ordem: number }[],
    ): Promise<void>;
    listarPorItem(itemId: string): Promise<Foto[]>;
}
