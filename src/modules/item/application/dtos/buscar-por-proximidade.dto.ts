import {
    IsNumber,
    IsOptional,
    IsEnum,
    IsArray,
    Min,
    Max,
    IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CategoriaItem, EstadoItem } from '../../infra/models/item.model';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarPorProximidadeDto {
    @ApiProperty({
        description: 'Raio de busca em metros (padrão: 5000m)',
        example: 5000,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(100)
    @Max(80000)
    @Type(() => Number)
    raioMetros?: number = 5000;

    @ApiProperty({
        description: 'Categorias para filtrar',
        example: ['ELETRONICOS', 'FERRAMENTAS'],
        isArray: true,
        required: false,
    })
    @IsArray()
    @IsOptional()
    @IsEnum(CategoriaItem, { each: true })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',') : value,
    )
    categorias?: CategoriaItem[];

    @ApiProperty({
        description: 'Preço máximo por dia para filtrar',
        example: 100,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    precoMaximoPorDia?: number;

    @ApiProperty({
        description:
            'Estado mínimo do item (NOVO, COMO_NOVO, BOM, REGULAR, PARA_CONSERTAR)',
        example: 'BOM',
        required: false,
    })
    @IsEnum(EstadoItem)
    @IsOptional()
    estadoMinimo?: EstadoItem;

    @ApiProperty({
        description: 'Ordenação dos resultados',
        example: 'distancia',
        enum: ['distancia', 'preco', 'popularidade'],
        required: false,
    })
    @IsIn(['distancia', 'preco', 'popularidade'])
    @IsOptional()
    ordenarPor?: 'distancia' | 'preco' | 'popularidade' = 'distancia';

    @ApiProperty({
        description: 'Limite de resultados (padrão: 20)',
        example: 20,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limite?: number = 20;

    @ApiProperty({
        description: 'Offset para paginação (padrão: 0)',
        example: 0,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset?: number = 0;
}
