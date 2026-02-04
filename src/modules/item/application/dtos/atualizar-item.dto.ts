import {
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsEnum,
    IsNumber,
    Min,
    Max,
    IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
    EstadoItem,
    CategoriaItem,
    TipoAnuncio,
} from '../../infra/models/item.model';

export class AtualizarItemDTO {
    @ApiProperty({
        description: 'Nome do item',
        example: 'Furadeira elétrica Bosch',
        required: false,
    })
    @IsString({ message: 'Nome deve ser uma string válida' })
    @MinLength(5, { message: 'Nome deve ter pelo menos 5 caracteres' })
    @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
    @IsOptional()
    nome?: string;

    @ApiProperty({
        description: 'Descrição detalhada do item',
        example:
            'Furadeira elétrica profissional Bosch com bateria de longa duração',
        required: false,
    })
    @IsString({ message: 'Descrição deve ser uma string válida' })
    @MinLength(50, { message: 'Descrição deve ter pelo menos 50 caracteres' })
    @MaxLength(2000, {
        message: 'Descrição deve ter no máximo 2000 caracteres',
    })
    @IsOptional()
    descricao?: string;

    @ApiProperty({
        description: 'Categoria do item',
        example: 'FERRAMENTAS',
        enum: CategoriaItem,
        required: false,
    })
    @IsEnum(CategoriaItem, { message: 'Categoria deve ser um valor válido' })
    @IsOptional()
    categoria?: CategoriaItem;

    @ApiProperty({
        description: 'Estado físico do item',
        example: 'NOVO',
        enum: EstadoItem,
        required: false,
    })
    @IsEnum(EstadoItem, { message: 'Estado deve ser um valor válido' })
    @IsOptional()
    estado?: EstadoItem;

    @ApiProperty({
        description: 'Tipo de anúncio',
        example: 'ALUGUEL',
        enum: TipoAnuncio,
        required: false,
    })
    @IsEnum(TipoAnuncio, {
        message: 'Tipo de anúncio deve ser um valor válido',
    })
    @IsOptional()
    tipoAnuncio?: TipoAnuncio;

    @ApiProperty({
        description: 'Preço por dia em reais',
        example: 50,
        required: false,
    })
    @IsNumber({}, { message: 'Preço por dia deve ser um número válido' })
    @Min(5, { message: 'Preço por dia deve ser no mínimo R$ 5,00' })
    @Max(10000, { message: 'Preço por dia deve ser no máximo R$ 10.000,00' })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorDia?: number;

    @ApiProperty({
        description: 'Preço por hora em reais',
        example: 10,
        required: false,
    })
    @IsNumber({}, { message: 'Preço por hora deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Preço por hora deve ser no mínimo R$ 1,00' })
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorHora?: number;

    @ApiProperty({
        description: 'Valor da caução em reais',
        example: 200,
        required: false,
    })
    @IsNumber({}, { message: 'Valor da caução deve ser um número válido' })
    @IsOptional()
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    valorCaucao?: number;

    @ApiProperty({
        description: 'Se a caução é obrigatória',
        example: true,
        required: false,
    })
    @IsBoolean({ message: 'Caução obrigatória deve ser um valor booleano' })
    @IsOptional()
    caucaoObrigatoria?: boolean;

    @ApiProperty({
        description: 'Dias mínimos de aluguel',
        example: 1,
        required: false,
    })
    @IsNumber({}, { message: 'Dias mínimos deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Dias mínimos deve ser no mínimo 1' })
    @Max(365, { message: 'Dias mínimos deve ser no máximo 365' })
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    diasMinimosAluguel?: number;

    @ApiProperty({
        description: 'Dias máximos de aluguel',
        example: 30,
        required: false,
    })
    @IsNumber({}, { message: 'Dias máximos deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Dias máximos deve ser no mínimo 1' })
    @Max(365, { message: 'Dias máximos deve ser no máximo 365' })
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    diasMaximosAluguel?: number;

    @ApiProperty({
        description: 'Permite aluguéis consecutivos',
        example: true,
        required: false,
    })
    @IsBoolean({ message: 'Aluguéis consecutivos deve ser um valor booleano' })
    @IsOptional()
    permitAluguelsConsecutivos?: boolean;

    @ApiProperty({
        description: 'Permite aluguel por hora',
        example: false,
        required: false,
    })
    @IsBoolean({ message: 'Aluguel por hora deve ser um valor booleano' })
    @IsOptional()
    permiteAluguelPorHora?: boolean;

    @ApiProperty({
        description: 'Horas mínimas de aluguel',
        example: 2,
        required: false,
    })
    @IsNumber({}, { message: 'Horas mínimas deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Horas mínimas deve ser no mínimo 1' })
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMinimosAluguel?: number;

    @ApiProperty({
        description: 'Horas máximas de aluguel',
        example: 8,
        required: false,
    })
    @IsNumber({}, { message: 'Horas máximas deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Horas máximas deve ser no mínimo 1' })
    @Type(() => Number)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMaximosAluguel?: number;
}
