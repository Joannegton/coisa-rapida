import { ApiProperty } from '@nestjs/swagger';
import { ItemCardDto } from './item-cards.dto';

export class ItemComDistanciaDto {
    @ApiProperty({
        description: 'Dados do item para exibição em card',
        type: ItemCardDto,
    })
    item: ItemCardDto;

    @ApiProperty({
        description: 'Distância em metros (null se não houver localização)',
        example: 1234.56,
        nullable: true,
    })
    distanciaMetros: number | null;

    @ApiProperty({
        description: 'Distância formatada (ex: "1.2 km", "350 m")',
        example: '1.2 km',
        nullable: true,
    })
    distanciaFormatada: string | null;
}
