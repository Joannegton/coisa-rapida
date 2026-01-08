import { Item } from '../item';

export type FiltrosGeograficos = {
    termo?: string;
    latitude: number;
    longitude: number;
    raioMetros: number;
    categorias?: string[];
    estados?: string[];
    precoMinimoPorDia?: number;
    precoMaximoPorDia?: number;
    ordenarPor?: 'distancia' | 'preco' | 'popularidade' | 'relevancia';
    limite?: number;
    offset?: number;
};

export type BuscarItensPopularesSemLocalizacaoProps = {
    termo?: string;
    categorias?: string[];
    estados?: string[];
    precoMinimoPorDia?: number;
    precoMaximoPorDia?: number;
    limite: number;
    offset: number;
};

export type ResultadoBuscaGeografica = {
    item: Item;
    distanciaMetros: number | null;
    distanciaFormatada?: string;
};

export type BuscarComDistancia = {
    itemId: string;
    latitude?: number;
    longitude?: number;
};

export interface ItemRepository {
    salvar(item: Item): Promise<Item>;

    buscar(id: string): Promise<Item | null>;

    /**
     * Busca item com pessimistic lock (FOR UPDATE) para evitar race conditions
     * Use quando for modificar disponibilidade/bloqueios
     */
    buscarComLock(id: string, useLock?: boolean): Promise<Item | null>;

    /**
     * Busca itens dentro de um raio específico (em metros) a partir de um ponto geográfico.
     * Utiliza PostGIS ST_DWithin para consulta otimizada com índice GiST.
     */
    buscarPorProximidade(
        filtros: FiltrosGeograficos,
    ): Promise<ResultadoBuscaGeografica[]>;

    buscarItensPopularesSemLocalizacao(
        props: BuscarItensPopularesSemLocalizacaoProps,
    ): Promise<Item[]>;

    buscarComDistancia(
        props: BuscarComDistancia,
    ): Promise<ResultadoBuscaGeografica | null>;

    /**
     * Calcula a distância (em metros) entre um item específico e um ponto geográfico.
     */
    calcularDistancia(
        itemId: string,
        latitude: number,
        longitude: number,
    ): Promise<number | null>;

    /**
     * Conta quantos itens ativos existem dentro de um raio.
     */
    contarPorProximidade(
        latitude: number,
        longitude: number,
        raioMetros: number,
    ): Promise<number>;

    /**
     * Busca itens para arquivamento (sem visualizações em 90 dias)
     */
    buscarParaArquivamento(): Promise<Item[]>;

    buscarPendentesAprovacao(pagina?: number, limite?: number): Promise<Item[]>;

    buscarAtivosDoUsuario(usuarioId: string): Promise<Item[]>;

    /**
     * Incrementa a versão de um item (para otimistic locking)
     * Usado quando fotos ou outras relações são modificadas sem carregar o item completo
     */
    incrementarVersao(itemId: string): Promise<void>;
}
