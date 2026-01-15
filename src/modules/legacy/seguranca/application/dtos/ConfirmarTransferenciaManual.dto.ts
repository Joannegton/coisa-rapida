import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ConfirmarTransferenciaManualDto {
  @IsNotEmpty()
  @IsString()
  transferenciaId: string;

  @IsOptional()
  @IsString()
  comprovante?: string; // URL ou ID do comprovante
}
