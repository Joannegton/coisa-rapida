import {
    IsEmail,
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarDto {
    @ApiProperty({
        description: 'Nome completo do usuário',
        example: 'João Silva',
    })
    @Transform(({ value }) => value?.trim())
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório.' })
    @MaxLength(100, { message: 'O nome pode ter no máximo 100 caracteres.' })
    nome: string;

    @ApiProperty({
        description: 'Email do usuário',
        example: 'usuario@example.com',
    })
    @Transform(({ value }) => value?.toLowerCase().trim())
    @IsEmail({}, { message: 'O email informado é inválido.' })
    @IsNotEmpty({ message: 'O email é obrigatório.' })
    email: string;

    @ApiProperty({
        description:
            'Senha do usuário (mín. 8 caracteres, com maiúscula, minúscula, número e especial)',
        example: 'NovaSenha1@',
    })
    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória.' })
    @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
    @MaxLength(128, { message: 'A senha pode ter no máximo 128 caracteres.' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        {
            message:
                'A senha deve conter: 1 minúscula, 1 maiúscula, 1 número e 1 caractere especial (@$!%*?&).',
        },
    )
    senha: string;

    @ApiProperty({
        description: 'CPF do usuário (somente números)',
        example: '12345678901',
    })
    @Transform(({ value }) => value?.replaceAll(/\D/g, ''))
    @IsString()
    @IsNotEmpty({ message: 'O CPF é obrigatório.' })
    @Matches(/^\d{11}$/, { message: 'O CPF deve conter 11 dígitos numéricos.' })
    cpf: string;
}
