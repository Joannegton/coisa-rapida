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

  @IsOptional()
  @IsString()
  chavePix?: string;

  @IsOptional()
  @IsString()
  telefonePix?: string;

  @IsOptional()
  @IsString()
  cpfPix?: string;
}

export class CriarAluguelDto {
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
  valorAluguel: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxaAppPercentual?: number;

  /**
   * Opcional: Se informado, cria aluguel com caução
   * Se não informado, cria aluguel SEM caução
   */
  @IsOptional()
  @IsNumber()
  caucao?: number;
}
