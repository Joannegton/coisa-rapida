export class ItemFotoDto {
    itemId: string;
    fotos: {
        fotoId: string;
        url: string;
        ordem: number;
        principal: boolean;
    }[];
}
