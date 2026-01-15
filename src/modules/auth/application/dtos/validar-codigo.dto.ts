import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidarCodigoDto {
    @ApiProperty({ example: 'usuario@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'A1B2C3' })
    @IsNotEmpty()
    @Length(6, 6)
    codigo: string;
}
