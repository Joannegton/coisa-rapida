import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'Email do usuário',
        example: 'usuario@example.com',
    })
    @Transform(({ value }) => value?.toLowerCase().trim())
    @IsString({ message: 'E-mail precisa ser uma string' })
    @IsEmail({}, { message: 'O email informado é inválido.' })
    @IsNotEmpty({ message: 'E-mail é obrigatório.' })
    email: string;

    @ApiProperty({ description: 'Senha do usuário', example: 'NovaSenha1@' })
    @IsString({ message: 'Senha precisa ser uma string' })
    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    senha: string;
}
