import { ApiProperty } from '@nestjs/swagger';
import {
    CategoriaItem,
    EstadoItem,
    StatusItem,
    TipoAnuncio,
} from '../../../infra/models/item.model';

export class ItemCardDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
    usuarioId: string;

    @ApiProperty({ example: 'Furadeira Elétrica Bosch' })
    nome: string;

    @ApiProperty({ enum: CategoriaItem, example: CategoriaItem.FERRAMENTAS })
    categoria: CategoriaItem;

    @ApiProperty({ enum: EstadoItem, example: 'usado' })
    estado: string;

    @ApiProperty({ enum: TipoAnuncio, example: 'aluguel' })
    tipoAnuncio: string;

    @ApiProperty({ example: 50, required: false })
    precoPorDia?: number;

    @ApiProperty({ example: 10, required: false })
    precoPorHora?: number;

    @ApiProperty({ example: 100, required: false })
    valorCaucao?: number;

    @ApiProperty({ example: true, required: false })
    permiteAluguelPorHora?: boolean;

    @ApiProperty({
        example: 'https://res.cloudinary.com/xyz/image/upload/v1/item-123.jpg',
        required: false,
    })
    fotoPrincipalUrl?: string;

    @ApiProperty({ enum: StatusItem, example: StatusItem.ATIVO })
    status: StatusItem;

    @ApiProperty({ example: true, required: false })
    disponivel?: boolean;
}
