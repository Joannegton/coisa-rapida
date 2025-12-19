import {
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsEnum,
    IsNumber,
    Min,
    Max,
    IsArray,
    IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoItem } from '../../infra/models/item.model';

export class AtualizarItemDTO {
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    @IsOptional()
    nome?: string;

    @IsString()
    @MinLength(50)
    @MaxLength(2000)
    @IsOptional()
    descricao?: string;

    @IsEnum(EstadoItem)
    @IsOptional()
    estado?: EstadoItem;

    @IsNumber()
    @Min(5)
    @Max(10000)
    @IsOptional()
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorDia?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorHora?: number;

    @IsNumber()
    @IsOptional()
    @Min(50)
    @Max(10000)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    valorCaucao?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    fotosUrls?: string[];

    @IsString()
    @IsOptional()
    fotoPrincipalUrl?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    localizacaoEndereco?: string;

    @IsBoolean()
    @IsOptional()
    disponivel?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(365)
    diasMinimosAluguel?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(365)
    diasMaximosAluguel?: number;

    @IsBoolean()
    @IsOptional()
    permitAluguelsConsecutivos?: boolean;

    @IsBoolean()
    @IsOptional()
    permiteAluguelPorHora?: boolean;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMinimosAluguel?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMaximosAluguel?: number;
}
