import {
    IsEmail,
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class RegistrarDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório.' })
    @MaxLength(100, { message: 'O nome pode ter no máximo 100 caracteres.' })
    nome: string;

    @IsEmail({}, { message: 'O email informado é inválido.' })
    @IsNotEmpty({ message: 'O email é obrigatório.' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
    @MaxLength(128, { message: 'A senha pode ter no máximo 128 caracteres.' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'A senha deve conter pelo menos 1 letra minúscula, 1 maiúscula e 1 número.',
    })
    senha: string;
}
