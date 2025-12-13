import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { TipoComprovante } from '../../infra/models/comprovante-residencia.model';

export class EnviarComprovanteResidenciaDto {
    @ApiProperty({
        description: 'Tipo do comprovante de residência',
        enum: TipoComprovante,
        example: TipoComprovante.CONTA_LUZ,
        required: true,
    })
    @IsNotEmpty({ message: 'Tipo do comprovante é obrigatório' })
    @IsEnum(TipoComprovante, { message: 'Tipo de comprovante inválido' })
    tipoComprovante: TipoComprovante;

    @ApiPropertyOptional({
        description: 'Observações do usuário sobre o comprovante',
        example: 'Comprovante de endereço atualizado',
        required: false,
    })
    @IsOptional()
    @IsString({ message: 'Observações devem ser uma string' })
    observacoesUsuario?: string;
}
