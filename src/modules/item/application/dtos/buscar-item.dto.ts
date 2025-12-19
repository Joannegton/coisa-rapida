import {
    IsString,
    IsOptional,
    IsEnum,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoriaItem, EstadoItem } from '../../infra/models/item.model';

export class BuscaItemDTO {
    @IsString()
    @IsOptional()
    termo?: string;

    @IsEnum(CategoriaItem)
    @IsOptional()
    categoria?: CategoriaItem;

    @IsEnum(EstadoItem)
    @IsOptional()
    estado?: EstadoItem;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorDiaMin?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorDiaMax?: number;

    @IsNumber()
    @IsOptional()
    @Min(-90)
    @Max(90)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    lat?: number;

    @IsNumber()
    @IsOptional()
    @Min(-180)
    @Max(180)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    lng?: number;

    @IsNumber()
    @IsOptional()
    @Min(0.1)
    @Max(100)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    distanciaKm?: number = 10;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    pagina?: number = 1;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    limite?: number = 20;

    @IsString()
    @IsOptional()
    ordenarPor?:
        | 'relevancia'
        | 'preco'
        | 'distancia'
        | 'avaliacao'
        | 'populares' = 'relevancia';

    @IsString()
    @IsOptional()
    ordem?: 'asc' | 'desc' = 'asc';
}
