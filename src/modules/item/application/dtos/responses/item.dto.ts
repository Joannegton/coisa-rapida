import { StatusItem } from '../../../infra/models/item.model';

export class ItemDto {
    id: string;
    usuarioId: string;
    nome: string;
    descricao: string;
    categoria: string;
    estado: string;
    tipoAnuncio: string;
    precoPorDia: number;
    precoPorHora?: number;
    valorCaucao?: number;
    permiteAluguelPorHora?: boolean;
    horasMinimosAluguel?: number;
    horasMaximosAluguel?: number;
    fotosUrls: { id: string; url: string; principal: boolean }[];
    fotoPrincipalUrl?: string;
    status: StatusItem;
    regrasDeUso?: string;
    disponivel: boolean;
    aluguelsTotais: number;
    diasMinimosAluguel: number;
    diasMaximosAluguel: number;
    permitAluguelsConsecutivos?: boolean;
    bairro?: string;
    distanciaFormatada?: string;
    proprietario?: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
}
