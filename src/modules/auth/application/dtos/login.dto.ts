import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @IsString({ message: 'E-mail precisa ser uma string' })
    @IsEmail({}, { message: 'O email informado é inválido.' })
    @IsNotEmpty({ message: 'E-mail é obrigatório.' })
    email: string;

    @IsString({ message: 'Senha precisa ser uma string' })
    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    senha: string;
}
