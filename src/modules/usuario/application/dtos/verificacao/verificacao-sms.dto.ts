import { IsString, Matches, IsNotEmpty, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EnviarCodigoSMSDto {
    @ApiProperty({
        description: 'Telefone do usuário no formato nacional (DDD + número)',
        example: '11970179933',
    })
    @Transform(({ value }) => String(value))
    @IsNotEmpty({ message: 'Telefone é obrigatório' })
    @IsString({ message: 'Telefone deve ser uma string' })
    @Length(10, 11, {
        message: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)',
    })
    @Matches(/^\d{10,11}$/, {
        message:
            'Telefone inválido. Use apenas números com DDD (10 ou 11 dígitos)',
    })
    telefone: string;
}

export class VerificarCodigoSMSDto {
    @ApiProperty({
        description: 'Telefone do usuário no formato nacional (DDD + número)',
        example: '11970179933',
    })
    @Transform(({ value }) => String(value))
    @IsNotEmpty({ message: 'Telefone é obrigatório' })
    @IsString({ message: 'Telefone deve ser uma string' })
    @Length(11, 11, { message: 'Telefone deve ter 11 dígitos (DDD + número)' })
    @Matches(/^\d{11}$/, {
        message: 'Telefone inválido. Use apenas números com DDD (11 dígitos)',
    })
    telefone: string;

    @ApiProperty({
        description: 'Código de verificação enviado por SMS',
        example: '123456',
    })
    @Transform(({ value }) => String(value))
    @IsNotEmpty({ message: 'Código é obrigatório' })
    @IsString({ message: 'Código deve ser uma string' })
    @Matches(/^\d{4,10}$/, {
        message: 'Código inválido. Use apenas números (4-10 dígitos)',
    })
    codigo: string;
}
