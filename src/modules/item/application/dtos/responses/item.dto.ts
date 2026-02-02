import { CategoriaItem, StatusItem } from '../../../infra/models/item.model';

export class ItemDto {
    id: string;
    usuarioId: string;
    nome: string;
    descricao: string;
    categoria: CategoriaItem;
    estado: string;
    tipoAnuncio: string;
    precoPorDia: number;
    precoPorHora?: number;
    valorCaucao?: number;
    permiteAluguelPorHora?: boolean;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
    fotosUrls: { url: string; principal: boolean }[];
    fotoPrincipalUrl?: string;
    status: StatusItem;
    disponivel: boolean;
    aluguelsTotais: number;
    diasMinimosAluguel: number;
    diasMaximosAluguel: number;
    bairro?: string;
    distanciaFormatada?: string;
    proprietario?: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
}
