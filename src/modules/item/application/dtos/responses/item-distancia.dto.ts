import { ItemCardDto } from './item-cards.dto';

export interface ItemComDistanciaDto {
    item: ItemCardDto;
    distanciaMetros: number | null;
    distanciaFormatada: string | null;
}
