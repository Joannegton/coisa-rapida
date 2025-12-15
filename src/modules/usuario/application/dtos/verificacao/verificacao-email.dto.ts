import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class EnviarLinkVerificacaoEmailDto {
    @ApiProperty({
        description: 'Email do usuário para envio do link de verificação',
        example: 'usuario@example.com',
    })
    @IsNotEmpty({ message: 'Email é obrigatório' })
    @IsEmail({}, { message: 'Email deve ser válido' })
    email: string;
}

export class VerificarLinkEmailDto {
    @ApiProperty({
        description: 'Token JWT contendo userId e email',
        example: 'eyJhbGc...',
    })
    @IsNotEmpty({ message: 'Token é obrigatório' })
    token: string;
}

export class ReenviarLinkVerificacaoEmailDto {
    @ApiProperty({
        description:
            'Email para reenvio do link (opcional, usa email do usuário logado por padrão)',
        example: 'usuario@example.com',
        required: false,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Email deve ser válido' })
    email?: string;
}
