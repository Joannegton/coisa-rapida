import { Item } from '../item';

export interface FiltrosBuscaItem {
    termo?: string;
    categoria?: string;
    estado?: string;
    status?: string;
    precoPorDiaMin?: number;
    precoPorDiaMax?: number;
    lat?: number;
    lng?: number;
    distanciaKm?: number;
    usuarioId?: string;
    reputacaoMinimaLocador?: number;
    pagina?: number;
    limite?: number;
    ordenarPor?:
        | 'relevancia'
        | 'preco'
        | 'distancia'
        | 'avaliacao'
        | 'populares';
    ordem?: 'asc' | 'desc';
}

export interface FiltrosGeograficos {
    latitude: number;
    longitude: number;
    raioMetros: number;
    categorias?: string[];
    precoMaximoPorDia?: number;
    estadoMinimo?: string;
    ordenarPor?: 'distancia' | 'preco' | 'popularidade';
    limite?: number;
    offset?: number;
}

export interface ResultadoBuscaGeografica {
    item: Item;
    distanciaMetros: number;
    distanciaFormatada?: string;
}

export interface ItemRepository {
    criar(item: Item): Promise<Item>;

    /**
     * Busca itens dentro de um raio específico (em metros) a partir de um ponto geográfico.
     * Utiliza PostGIS ST_DWithin para consulta otimizada com índice GiST.
     */
    buscarPorProximidade(
        filtros: FiltrosGeograficos,
    ): Promise<ResultadoBuscaGeografica[]>;

    /**
     * Busca itens ordenados por distância de um ponto (sem limite de raio).
     * Útil para listar "itens mais próximos" globalmente.
     */
    buscarMaisProximos(
        latitude: number,
        longitude: number,
        limite?: number,
        offset?: number,
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
