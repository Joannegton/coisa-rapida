import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CriarCheckoutDto {
  @IsNotEmpty({ message: 'O campo "valor" é obrigatório.' })
  @Transform(({ value }) => Number(value))
  @Min(0.01)
  valor: number;

  @IsNotEmpty({ message: 'O campo "itemNome" é obrigatório.' })
  @IsString()
  itemNome: string;

  @IsString()
  @IsNotEmpty({
    message: 'O campo "itemDescricao" não pode estar vazio.',
    each: true,
  })
  itemDescricao: string;

  @IsNotEmpty({ message: 'O campo "aluguelId" é obrigatório.' })
  aluguelId: string;

  @IsNotEmpty({ message: 'O campo "locatarioEmail" é obrigatório.' })
  @IsEmail()
  locatarioEmail: string;

  @IsOptional()
  @IsString()
  locatarioNome?: string;

  @IsNotEmpty({ message: 'O campo "locatarioId" é obrigatório.' })
  @IsString()
  locatarioId: string;

  @IsNotEmpty({ message: 'O campo "locadorId" é obrigatório.' })
  @IsString()
  locadorId: string;

  @IsOptional()
  @IsString()
  locatarioTelefone?: string;

  @IsNotEmpty({ message: 'O campo "tipo" é obrigatório.' })
  @IsString()
  tipo: 'aluguel' | 'venda';
}
