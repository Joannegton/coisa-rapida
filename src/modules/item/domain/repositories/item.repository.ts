import { Item } from '../item';

export type FiltrosGeograficos = {
    latitude: number;
    longitude: number;
    raioMetros: number;
    categorias?: string[];
    precoMaximoPorDia?: number;
    estadoMinimo?: string;
    ordenarPor?: 'distancia' | 'preco' | 'popularidade';
    limite?: number;
    offset?: number;
};

export type BuscarItensPopularesSemLocalizacaoProps = {
    categorias?: string[];
    precoMaximoPorDia?: number;
    estadoMinimo?: string;
    limite: number;
    offset: number;
};

export type ResultadoBuscaGeografica = {
    item: Item;
    distanciaMetros: number;
    distanciaFormatada?: string;
};

export interface ItemRepository {
    criar(item: Item): Promise<Item>;

    buscarItensPopularesSemLocalizacao(
        props: BuscarItensPopularesSemLocalizacaoProps,
    ): Promise<Item[]>;

    /**
     * Busca itens dentro de um raio específico (em metros) a partir de um ponto geográfico.
     * Utiliza PostGIS ST_DWithin para consulta otimizada com índice GiST.
     */
    buscarPorProximidade(
        filtros: FiltrosGeograficos,
    ): Promise<ResultadoBuscaGeografica[]>;

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
}
