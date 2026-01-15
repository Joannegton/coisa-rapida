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
import { Transform } from 'class-transformer';
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
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    @IsOptional()
    nome?: string;

    @ApiProperty({
        description: 'Descrição detalhada do item',
        example:
            'Furadeira elétrica profissional Bosch com bateria de longa duração',
        required: false,
    })
    @IsString()
    @MinLength(50)
    @MaxLength(2000)
    @IsOptional()
    descricao?: string;

    @ApiProperty({
        description: 'Categoria do item',
        example: 'FERRAMENTAS',
        enum: CategoriaItem,
        required: false,
    })
    @IsEnum(CategoriaItem)
    @IsOptional()
    categoria?: CategoriaItem;

    @ApiProperty({
        description: 'Estado físico do item',
        example: 'NOVO',
        enum: EstadoItem,
        required: false,
    })
    @IsEnum(EstadoItem)
    @IsOptional()
    estado?: EstadoItem;

    @ApiProperty({
        description: 'Tipo de anúncio',
        example: 'ALUGUEL',
        enum: TipoAnuncio,
        required: false,
    })
    @IsEnum(TipoAnuncio)
    @IsOptional()
    tipoAnuncio?: TipoAnuncio;

    @ApiProperty({
        description: 'Preço por dia em reais',
        example: 50,
        required: false,
    })
    @IsNumber()
    @Min(1)
    @Max(10000)
    @IsOptional()
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorDia?: number;

    @ApiProperty({
        description: 'Preço por hora em reais',
        example: 10,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorHora?: number;

    @ApiProperty({
        description: 'Valor da caução em reais',
        example: 200,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(10000)
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    valorCaucao?: number;

    @ApiProperty({
        description: 'Se a caução é obrigatória',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    caucaoObrigatoria?: boolean;

    @ApiProperty({
        description: 'Dias mínimos de aluguel',
        example: 1,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(365)
    diasMinimosAluguel?: number;

    @ApiProperty({
        description: 'Dias máximos de aluguel',
        example: 30,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(365)
    diasMaximosAluguel?: number;

    @ApiProperty({
        description: 'Permite aluguéis consecutivos',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    permitAluguelsConsecutivos?: boolean;

    @ApiProperty({
        description: 'Permite aluguel por hora',
        example: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    permiteAluguelPorHora?: boolean;

    @ApiProperty({
        description: 'Horas mínimas de aluguel',
        example: 2,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMinimosAluguel?: number;

    @ApiProperty({
        description: 'Horas máximas de aluguel',
        example: 8,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMaximosAluguel?: number;

    @ApiProperty({
        description: 'Aprova automaticamente novos aluguéis',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    aprovacaoAutomatica?: boolean;
}
