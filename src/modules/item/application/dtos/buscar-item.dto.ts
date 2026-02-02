import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class BuscarItemDto {
    @ApiProperty({
        description: 'Latitude do usuário (para cálculo de distância)',
        example: -23.55052,
        required: true,
    })
    @IsNumber(
        {},
        { message: 'A latitude do usuário deve ser um número válido' },
    )
    @Type(() => Number)
    @IsOptional()
    latitude?: number;

    @ApiProperty({
        description: 'Longitude do usuário (para cálculo de distância)',
        example: -46.633308,
        required: true,
    })
    @IsNumber(
        {},
        { message: 'A longitude do usuário deve ser um número válido' },
    )
    @Type(() => Number)
    @IsOptional()
    longitude?: number;
}
