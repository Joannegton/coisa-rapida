import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SolicitarRecuperarSenhaDto {
    @ApiProperty({
        description: 'Email do usuário para recuperação de senha',
        example: 'usuario@example.com',
    })
    @IsEmail()
    @IsNotEmpty({ message: 'O email é obrigatório.' })
    @IsString({ message: 'O email precisa ser uma string.' })
    email: string;
}
