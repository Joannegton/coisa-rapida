import {
    CategoriaItem,
    EstadoItem,
    StatusItem,
    TipoAnuncio,
} from '../../../infra/models/item.model';

export class ItemCardDto {
    id: string;
    usuarioId: string;
    nome: string;
    categoria: CategoriaItem;
    estado: EstadoItem;
    tipoAnuncio: TipoAnuncio;
    precoPorDia?: number;
    precoPorHora?: number;
    valorCaucao?: number;
    permiteAluguelPorHora?: boolean;
    fotoPrincipalUrl?: string;
    status: StatusItem;
    disponivel?: boolean;
}
