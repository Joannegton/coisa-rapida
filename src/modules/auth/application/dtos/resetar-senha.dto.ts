import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetarSenhaDto {
    @ApiProperty({
        description: 'Token temporário para resetar a senha',
        example: 'abcdef123456...',
    })
    @IsNotEmpty({ message: 'Token temporário é obrigatório.' })
    @IsString({ message: 'Token temporário precisa ser uma string.' })
    tokenTemporario: string;

    @ApiProperty({
        description: 'Nova senha do usuário',
        example: 'NovaSenha1@',
    })
    @IsNotEmpty({ message: 'Nova senha é obrigatória.' })
    @IsString({ message: 'Nova senha precisa ser uma string.' })
    novaSenha: string;
}
