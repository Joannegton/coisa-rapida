import {
    IsString,
    MinLength,
    MaxLength,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    Max,
    IsBoolean,
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
    CategoriaItem,
    EstadoItem,
    TipoAnuncio,
} from '../../infra/models/item.model';

export class CriarItemDto {
    @ApiProperty({
        description: 'Nome do item a ser anunciado',
        example: 'Bicicleta Caloi Aro 29',
        required: true,
    })
    @IsString({ message: 'Nome deve ser uma string válida' })
    @MinLength(5, { message: 'Nome deve ter pelo menos 5 caracteres' })
    @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
    nome: string;

    @ApiProperty({
        description: 'Descrição detalhada do item',
        example:
            'Bicicleta em excelente estado, ideal para passeios urbanos...',
        required: true,
    })
    @IsString({ message: 'Descrição deve ser uma string válida' })
    @MinLength(50, { message: 'Descrição deve ter pelo menos 50 caracteres' })
    @MaxLength(2000, {
        message: 'Descrição deve ter no máximo 2000 caracteres',
    })
    descricao: string;

    @ApiProperty({
        description: 'Categoria do item',
        example: CategoriaItem.ELETRONICOS,
        enum: CategoriaItem,
        required: true,
    })
    @IsEnum(CategoriaItem, { message: 'Categoria deve ser um valor válido' })
    categoria: CategoriaItem;

    @ApiProperty({
        description: 'Estado de conservação do item',
        example: EstadoItem.BOM,
        enum: EstadoItem,
        required: false,
        default: EstadoItem.BOM,
    })
    @IsEnum(EstadoItem, { message: 'Estado deve ser um valor válido' })
    @IsOptional()
    estado: EstadoItem = EstadoItem.BOM;

    @ApiProperty({
        description: 'Tipo de anúncio',
        example: TipoAnuncio.ALUGUEL,
        enum: TipoAnuncio,
        required: false,
        default: TipoAnuncio.ALUGUEL,
    })
    @IsEnum(TipoAnuncio, {
        message: 'Tipo de anúncio deve ser um valor válido',
    })
    @IsOptional()
    tipoAnuncio: TipoAnuncio = TipoAnuncio.ALUGUEL;

    @ApiProperty({
        description: 'Preço por dia de aluguel em reais',
        example: 25.5,
        minimum: 5,
        maximum: 10000,
        required: true,
    })
    @IsNumber({}, { message: 'Preço por dia deve ser um número válido' })
    @Min(5, { message: 'Preço por dia deve ser no mínimo R$ 5,00' })
    @Max(10000, { message: 'Preço por dia deve ser no máximo R$ 10.000,00' })
    @Transform(({ value }) => Number.parseFloat(value))
    precoPorDia: number;

    @ApiProperty({
        description: 'Preço por hora de aluguel em reais (opcional)',
        example: 5,
        minimum: 1,
        required: false,
    })
    @IsNumber({}, { message: 'Preço por hora deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Preço por hora deve ser no mínimo R$ 1,00' })
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    precoPorHora?: number;

    @ApiProperty({
        description: 'Valor da caução em reais (opcional)',
        example: 100,
        minimum: 50,
        maximum: 10000,
        required: false,
    })
    @IsNumber({}, { message: 'Valor da caução deve ser um número válido' })
    @IsOptional()
    @Min(50, { message: 'Valor da caução deve ser no mínimo R$ 50,00' })
    @Max(10000, { message: 'Valor da caução deve ser no máximo R$ 10.000,00' })
    @Transform(({ value }) => (value ? Number.parseFloat(value) : undefined))
    valorCaucao?: number;

    @ApiProperty({
        description: 'Indica se a caução é obrigatória',
        example: false,
        required: false,
        default: false,
    })
    @IsBoolean({ message: 'Caução obrigatória deve ser um valor booleano' })
    @IsOptional()
    caucaoObrigatoria: boolean = true;

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Arquivos de fotos do item (mínimo 1, máximo 3)',
        required: true,
    })
    @IsArray({ message: 'Fotos deve ser um array de arquivos' })
    @ArrayMinSize(1, { message: 'Deve haver pelo menos 1 foto do item' })
    @ArrayMaxSize(3, { message: 'Pode haver no máximo 3 fotos do item' })
    @IsOptional()
    fotos?: Express.Multer.File[];

    @ApiProperty({
        description: 'Número mínimo de dias para aluguel',
        example: 1,
        minimum: 1,
        maximum: 365,
        required: false,
        default: 1,
    })
    @IsNumber({}, { message: 'Dias mínimos deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Dias mínimos deve ser no mínimo 1' })
    @Max(365, { message: 'Dias mínimos deve ser no máximo 365' })
    diasMinimosAluguel: number = 1;

    @ApiProperty({
        description: 'Número máximo de dias para aluguel',
        example: 30,
        minimum: 1,
        maximum: 365,
        required: false,
        default: 365,
    })
    @IsNumber({}, { message: 'Dias máximos deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Dias máximos deve ser no mínimo 1' })
    @Max(365, { message: 'Dias máximos deve ser no máximo 365' })
    diasMaximosAluguel?: number = 365;

    @ApiProperty({
        description: 'Permite aluguéis consecutivos',
        example: true,
        required: false,
        default: true,
    })
    @IsBoolean({ message: 'Aluguéis consecutivos deve ser um valor booleano' })
    @IsOptional()
    permitAluguelsConsecutivos?: boolean = true;

    @ApiProperty({
        description: 'Permite aluguel por hora',
        example: false,
        required: false,
        default: false,
    })
    @IsBoolean({ message: 'Aluguel por hora deve ser um valor booleano' })
    @IsOptional()
    permiteAluguelPorHora?: boolean = false;

    @ApiProperty({
        description:
            'Número mínimo de horas para aluguel (se permite por hora)',
        example: 2,
        minimum: 1,
        required: false,
    })
    @IsNumber({}, { message: 'Horas mínimas deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Horas mínimas deve ser no mínimo 1' })
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMinimasAluguel?: number;

    @ApiProperty({
        description:
            'Número máximo de horas para aluguel (se permite por hora)',
        example: 8,
        minimum: 1,
        required: false,
    })
    @IsNumber({}, { message: 'Horas máximas deve ser um número válido' })
    @IsOptional()
    @Min(1, { message: 'Horas máximas deve ser no mínimo 1' })
    @Transform(({ value }) => (value ? Number.parseInt(value) : undefined))
    horasMaximasAluguel?: number;
}
