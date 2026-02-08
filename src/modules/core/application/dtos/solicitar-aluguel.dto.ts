import {
    IsString,
    IsUUID,
    IsOptional,
    MinLength,
    MaxLength,
    Matches,
    ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitarAluguelDto {
    @ApiProperty({
        description: 'ID do item a ser alugado',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsUUID('4', { message: 'ID do item deve ser um UUID válido' })
    itemId: string;

    @ApiProperty({
        description: 'Data e hora de início do aluguel',
        example: '2026-01-10T09:00:00.000Z',
        required: true,
    })
    @IsString({ message: 'Data de início deve ser uma string' })
    @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
        message: 'Data de início deve estar no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
    })
    dataInicio: string;

    @ApiProperty({
        description: 'Data e hora de fim do aluguel',
        example: '2026-01-12T18:00:00.000Z',
        required: true,
    })
    @IsString({ message: 'Data de fim deve ser uma string' })
    @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
        message: 'Data de fim deve estar no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
    })
    dataFim: string;

    @ApiProperty({
        description: 'Observações do locatário sobre o aluguel',
        example: 'Gostaria de alugar por 2 dias, item em bom estado',
        required: false,
        maxLength: 500,
    })
    @IsString({ message: 'Observações deve ser uma string válida' })
    @IsOptional()
    @ValidateIf((o) => o.observacoesLocatario && o.observacoesLocatario.length > 0)
    @MinLength(10, { message: 'Observações deve ter pelo menos 10 caracteres' })
    @ValidateIf((o) => o.observacoesLocatario && o.observacoesLocatario.length > 0)
    @MaxLength(500, {
        message: 'Observações deve ter no máximo 500 caracteres',
    })
    observacoesLocatario?: string;
}
