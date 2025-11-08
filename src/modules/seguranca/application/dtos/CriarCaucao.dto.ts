import { IsNotEmpty, IsNumber, IsString, IsEmail, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ItemAluguelDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

class ParticipanteDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  contaMPId?: string;
}

export class CriarCaucaoDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ItemAluguelDto)
  item: ItemAluguelDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParticipanteDto)
  locatario: ParticipanteDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ParticipanteDto)
  locador: ParticipanteDto;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valorCaucao: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valorAluguel: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxaAppPercentual?: number;
}
