import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';

export class FinalizarAluguelDto {
  @IsNotEmpty()
  @IsString()
  aluguelId: string;

  @IsNotEmpty()
  @IsBoolean()
  houveDano: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valorIndenizacao?: number;
}
