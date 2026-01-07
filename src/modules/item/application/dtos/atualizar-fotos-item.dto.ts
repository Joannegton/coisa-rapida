import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsOptional,
    ArrayMinSize,
    ArrayMaxSize,
} from 'class-validator';

export class AtualizarFotosItemDTO {
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
}
