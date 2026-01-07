import { IsArray, ArrayMinSize, ArrayMaxSize, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdicionarFotosItemDTO {
    @ApiProperty({
        description: 'Fotos a adicionar (1-3 arquivos)',
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    fotos: Express.Multer.File[];

    @ApiProperty({
        description: 'ID da foto que será principal (opcional)',
        example: 'coisaRapida/itens/af4b7a80-.../foto1.png',
        required: false,
    })
    @IsString()
    @IsOptional()
    fotoPrincipalId?: string;
}
