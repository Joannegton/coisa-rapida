import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class EnderecoDto {
    @ApiProperty({
        description: 'Nome da rua',
        example: 'dores de campos',
        minLength: 2,
        maxLength: 100,
    })
    @IsNotEmpty({ message: 'Rua é obrigatória' })
    @IsString({ message: 'Rua deve ser uma string' })
    @MinLength(2, { message: 'Rua deve ter pelo menos 2 caracteres' })
    @MaxLength(100, { message: 'Rua deve ter no máximo 100 caracteres' })
    rua: string;

    @ApiProperty({
        description: 'Número do endereço',
        example: '456',
        minLength: 1,
        maxLength: 10,
    })
    @IsNotEmpty({ message: 'Número é obrigatório' })
    @IsString({ message: 'Número deve ser uma string' })
    @MinLength(1, { message: 'Número deve ter pelo menos 1 caractere' })
    @MaxLength(10, { message: 'Número deve ter no máximo 10 caracteres' })
    numero: string;

    @ApiPropertyOptional({
        description: 'Complemento do endereço',
        example: 'Bloco2B ap04',
        maxLength: 50,
    })
    @IsOptional()
    @IsString({ message: 'Complemento deve ser uma string' })
    @MaxLength(50, { message: 'Complemento deve ter no máximo 50 caracteres' })
    complemento?: string;

    @ApiProperty({
        description: 'Bairro',
        example: 'Vila nova bonsucesso',
        minLength: 2,
        maxLength: 50,
    })
    @IsNotEmpty({ message: 'Bairro é obrigatório' })
    @IsString({ message: 'Bairro deve ser uma string' })
    @MinLength(2, { message: 'Bairro deve ter pelo menos 2 caracteres' })
    @MaxLength(50, { message: 'Bairro deve ter no máximo 50 caracteres' })
    bairro: string;

    @ApiProperty({
        description: 'Cidade',
        example: 'Guarulhos',
        minLength: 2,
        maxLength: 50,
    })
    @IsNotEmpty({ message: 'Cidade é obrigatória' })
    @IsString({ message: 'Cidade deve ser uma string' })
    @MinLength(2, { message: 'Cidade deve ter pelo menos 2 caracteres' })
    @MaxLength(50, { message: 'Cidade deve ter no máximo 50 caracteres' })
    cidade: string;

    @ApiProperty({
        description: 'Estado (UF)',
        example: 'SP',
        minLength: 2,
        maxLength: 2,
    })
    @IsNotEmpty({ message: 'Estado é obrigatório' })
    @IsString({ message: 'Estado deve ser uma string' })
    @MinLength(2, { message: 'Estado deve ter exatamente 2 caracteres' })
    @MaxLength(2, { message: 'Estado deve ter exatamente 2 caracteres' })
    @Matches(/^[A-Z]{2}$/, {
        message: 'Estado deve ser uma sigla válida (ex: SP)',
    })
    estado: string;

    @ApiProperty({
        description: 'CEP',
        example: '07176-390',
        pattern: '^[0-9]{5}-[0-9]{3}$',
    })
    @IsNotEmpty({ message: 'CEP é obrigatório' })
    @IsString({ message: 'CEP deve ser uma string' })
    @Matches(/^[0-9]{5}-[0-9]{3}$/, {
        message: 'CEP deve estar no formato 00000-000',
    })
    cep: string;

    @ApiPropertyOptional({
        description: 'País',
        example: 'Brasil',
        default: 'Brasil',
        maxLength: 50,
    })
    @IsOptional()
    @IsString({ message: 'País deve ser uma string' })
    @MaxLength(50, { message: 'País deve ter no máximo 50 caracteres' })
    pais?: string = 'Brasil';

    @ApiPropertyOptional({
        description: 'Latitude',
        example: -23.55052,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Latitude deve ser um número' })
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude',
        example: -46.633308,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Longitude deve ser um número' })
    longitude?: number;
}
