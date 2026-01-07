import {
    IsArray,
    IsString,
    IsNumber,
    Min,
    Max,
    ArrayNotEmpty,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FotoOrdenacaoDTO {
    @ApiProperty({
        description: 'ID da foto',
        example: 'coisaRapida/itens/af4b7a80-.../foto1.png',
    })
    @IsString()
    id: string;

    @ApiProperty({
        description: 'Nova posição (1, 2, 3)',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    @Max(3)
    ordem: number;
}

export class AtualizarOrdemFotosDTO {
    @ApiProperty({
        description: 'Array com novas ordens das fotos',
        type: [FotoOrdenacaoDTO],
        example: [
            { id: 'foto1', ordem: 1 },
            { id: 'foto2', ordem: 2 },
            { id: 'foto3', ordem: 3 },
        ],
    })
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FotoOrdenacaoDTO)
    ordem: FotoOrdenacaoDTO[];

    @ApiProperty({
        description: 'ID da foto que será principal',
        example: 'coisaRapida/itens/af4b7a80-.../foto2.png',
        required: false,
    })
    @IsString()
    @IsOptional()
    fotoPrincipalId?: string;
}
