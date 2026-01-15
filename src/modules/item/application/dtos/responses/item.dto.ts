import {
    CategoriaItem,
    EstadoItem,
    StatusItem,
    TipoAnuncio,
} from '../../../infra/models/item.model';

export class ItemDto {
    id: string;
    usuarioId: string;
    nome: string;
    descricao: string;
    categoria: CategoriaItem;
    estado: EstadoItem;
    tipoAnuncio: TipoAnuncio;
    precoPorDia: number;
    precoPorHora?: number;
    valorCaucao?: number;
    permiteAluguelPorHora?: boolean;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
    fotosUrls: string[];
    fotoPrincipalUrl?: string;
    status: StatusItem;
    disponivel: boolean;
    aluguelsTotais: number;
    diasMinimosAluguel: number;
    diasMaximosAluguel: number;
    criadoEm: Date;
    atualizadoEm: Date;
}
