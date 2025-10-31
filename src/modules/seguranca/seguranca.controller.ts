import { Controller, Post, Get, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile, Query, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SalvarComprovanteResidenciaUseCase } from './application/usecases/SalvarComprovanteResidencia.usecase';
import { FirebaseAuthGuard } from './infra/auth/FirebaseAuth.guard';
import { CurrentUser } from './infra/auth/CurrentUser.decorator';
import * as FirebaseAuthStrategy from './infra/auth/FirebaseAuth.strategy';
import { ListarVerificacoesPendentesUseCase } from './application/queries/ListarVerificacoesPendentes.usecase';
import type { ProcessarStatusComprovanteResidenciaProps } from './application/usecases/ProcessarStatusComprovanteResidencia.usecase';
import { ProcessarStatusComprovanteResidenciaUseCase } from './application/usecases/ProcessarStatusComprovanteResidencia.usecase';
import { BuscarVerificacaoPorIdQuery } from './application/queries/BuscarVerificacaoId.query';
import { EnviarCodigoSMSUseCase } from './application/usecases/EnviarCodigoSMS.usecase';
import { VerificarCodigoSMSUseCase } from './application/usecases/VerificarCodigoSMS.usecase';
import { EnviarCodigoSMSDto, VerificarCodigoSMSDto } from './application/dtos/verificacao-sms.dto';

@Controller('seguranca')
export class SegurancaController {
  constructor(
    private readonly salvarComprovanteUseCase: SalvarComprovanteResidenciaUseCase,
    private readonly processarVerificacaoUseCase: ProcessarStatusComprovanteResidenciaUseCase,
    private readonly listarPendentesUseCase: ListarVerificacoesPendentesUseCase,
    private readonly buscarPorIdQuery: BuscarVerificacaoPorIdQuery,
    private readonly enviarCodigoSMSUseCase: EnviarCodigoSMSUseCase,
    private readonly verificarCodigoSMSUseCase: VerificarCodigoSMSUseCase,
  ) {}

  @Post('verificacao-residencia')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('comprovante'))
  async solicitarVerificacaoResidencia(
    @UploadedFile() comprovante: Express.Multer.File,
    @Body() body: { tipoComprovante: string; observacoes?: string },
    @CurrentUser() user: FirebaseAuthStrategy.FirebaseUser,
  ): Promise<any> {
      const result = await this.salvarComprovanteUseCase.execute({
        usuarioId: user.uid,
        comprovante,
        tipoComprovante: body.tipoComprovante,
        observacoes: body.observacoes,
      });

      if (result.ehFalha()) {
        throw new HttpException({
          success: false,
          message: result.erro?.message || 'Erro desconhecido',
        }, 400);
      }

      return {
        success: true,
        data: result.valor,
      };

  }

  @Put('verificacao-residencia/:id/processar')
  @UseGuards(FirebaseAuthGuard)
  async processarVerificacaoResidencia(
    @Param('id') verificacaoId: string,
    @Body() body: ProcessarStatusComprovanteResidenciaProps,
  ): Promise<any> {
      const result = await this.processarVerificacaoUseCase.execute({
        idComprovanteResidencia: verificacaoId,
        status: body.status,
        motivoRejeicao: body.motivoRejeicao,
        observacoes: body.observacoes,
      });

       if (result.ehFalha()) {
        throw new Error(result.erro?.message || 'Erro desconhecido');
      }

      return {
        success: true,
        data: result.valor,
      };

  }

  @Get('verificacao-residencia/pendentes')
  async listarVerificacoesPendentes(
    @Query('limite') limite: number,
  ): Promise<any> {
      const result = await this.listarPendentesUseCase.execute(limite);

      if (result.ehFalha()) {
        throw new Error(result.erro?.message || 'Erro desconhecido');
      }

      return {
        success: true,
        data: result.valor,
      };
  }

  @Get('verificacao-residencia')
  async buscarPorId(
    @Query('id') id: string,
  ): Promise<any> {
      const result = await this.buscarPorIdQuery.execute(id);

      if (result.ehFalha()) {
        throw new Error(result.erro?.message || 'Erro desconhecido');
      }

      return {
        success: true,
        data: result.valor,
      };
  }

  // ==================== VERIFICAÇÃO SMS ====================

  @Post('verificacao-sms/enviar')
  async enviarCodigoSMS(
    @Body() dto: EnviarCodigoSMSDto,
    @CurrentUser() user?: FirebaseAuthStrategy.FirebaseUser,
  ): Promise<any> {
      const result = await this.enviarCodigoSMSUseCase.execute({
        telefone: dto.telefone,
        usuarioId: user?.uid,
      });

      if (result.ehFalha()) {
        throw new Error(result.erro?.message || 'Erro desconhecido');
      }

      return {
        success: true,
        data: result.valor,
      };
  }

  @Post('verificacao-sms/verificar')
  @UseGuards(FirebaseAuthGuard)
  async verificarCodigoSMS(
    @Body() dto: VerificarCodigoSMSDto,
    @CurrentUser() user: FirebaseAuthStrategy.FirebaseUser,
  ): Promise<any> {
      const result = await this.verificarCodigoSMSUseCase.execute({
        telefone: dto.telefone,
        codigo: dto.codigo,
        usuarioId: user.uid,
      });

      if (result.ehFalha()) {
        throw new Error(result.erro?.message || 'Erro desconhecido');
      }

      return {
        success: true,
        data: result.valor,
      };
  }

  @Post('verificacao-sms/reenviar')
  async reenviarCodigoSMS(
    @Body() dto: EnviarCodigoSMSDto,
    @CurrentUser() user?: FirebaseAuthStrategy.FirebaseUser,
  ): Promise<any> {
      const result = await this.enviarCodigoSMSUseCase.execute({
        telefone: dto.telefone,
        usuarioId: user?.uid,
      });

      if (result.ehFalha()) {
        throw new Error(result.erro?.message || 'Erro desconhecido');
      }

      return {
        success: true,
        data: result.valor,
      };
  }
}
