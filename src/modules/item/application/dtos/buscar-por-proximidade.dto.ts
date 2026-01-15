import {
    IsNumber,
    IsOptional,
    IsEnum,
    IsArray,
    Min,
    Max,
    IsIn,
    IsString,
    MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CategoriaItem, EstadoItem } from '../../infra/models/item.model';
import { ApiProperty } from '@nestjs/swagger';

export class BuscarPorProximidadeDto {
    @ApiProperty({
        description: 'Termo de busca (busca em nome e descrição)',
        example: 'furadeira elétrica',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MinLength(3)
    termo?: string;

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
        description: 'Estados específicos do item para filtrar',
        example: ['NOVO', 'COMO_NOVO', 'BOM'],
        isArray: true,
        required: false,
    })
    @IsArray()
    @IsOptional()
    @IsEnum(EstadoItem, { each: true })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',') : value,
    )
    estados?: EstadoItem[];

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
        description: 'Preço mínimo por dia para filtrar',
        example: 20,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    precoMinimoPorDia?: number;

    @ApiProperty({
        description: 'Ordenação dos resultados',
        example: 'distancia',
        enum: ['distancia', 'preco', 'popularidade', 'relevancia'],
        required: false,
    })
    @IsIn(['distancia', 'preco', 'popularidade', 'relevancia'])
    @IsOptional()
    ordenarPor?: 'distancia' | 'preco' | 'popularidade' | 'relevancia' =
        'distancia';

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

    @ApiProperty({
        description:
            'Latitude do usuário (obtida do GPS/localização do dispositivo)',
        example: -23.55052,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    latitude?: number;

    @ApiProperty({
        description:
            'Longitude do usuário (obtida do GPS/localização do dispositivo)',
        example: -46.633308,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    longitude?: number;
}
