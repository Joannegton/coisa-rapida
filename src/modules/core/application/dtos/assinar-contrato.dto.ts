import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class AssinarContratoDto {
    @ApiPropertyOptional({
        description: 'Latitude da localização',
        type: Number,
        example: -23.55052,
    })
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude da localização',
        type: Number,
        example: -46.633308,
    })
    @IsOptional()
    longitude?: number;
}
