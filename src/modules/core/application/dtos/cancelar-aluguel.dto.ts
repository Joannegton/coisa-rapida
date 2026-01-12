import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelarAluguelDto {
    @ApiPropertyOptional({
        description: 'Motivo do cancelamento (opcional)',
        example: 'Mudança de planos',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    motivo?: string;

    @ApiPropertyOptional({
        description: 'Aceita pagar penalidade se houver (opcional)',
        example: true,
    })
    @IsOptional()
    aceitaPenalidade?: boolean;
}