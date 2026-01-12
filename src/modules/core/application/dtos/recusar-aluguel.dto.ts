import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RecusarAluguelDto {
    @ApiProperty({
        description: 'Motivo da recusa (obrigatório)',
        example: 'Item não disponível nas datas solicitadas',
        maxLength: 500,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    motivo: string;
}