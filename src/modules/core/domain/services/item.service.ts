export interface ItemResult {
    id: string;
    usuarioId: string;
    nome: string;
    descricao?: string;
    precoDiaria: number;
    precoHora?: number;
    fotoUrl?: string;
    versao: number;
    valorCaucao?: number;
    caucaoObrigatoria: boolean;
    disponibilidade: {
        disponivel: boolean;
        datasBloqueadas?: DatasBloqueadas[];
        permiteAluguelPorHora?: boolean;
        diasMinimosAluguel?: number;
        diasMaximosAluguel?: number;
        horasMinimosAluguel?: number;
        horasMaximosAluguel?: number;
    };
}

export type DatasBloqueadas = {
    dataInicio: Date;
    dataFim: Date;
    motivo?: string;
};

export type AdicionarBloqueioProps = {
    itemId: string;
    bloqueio: DatasBloqueadas;
    useLock?: boolean;
};

export type RemoverBloqueioProps = {
    itemId: string;
    dataInicio: Date;
    dataFim: Date;
    useLock?: boolean;
};

export interface CoreItemService {
    buscar(id: string): Promise<ItemResult>;
    adicionarBloqueio(porps: AdicionarBloqueioProps): Promise<void>;
    removerBloqueio(props: RemoverBloqueioProps): Promise<void>;
}
