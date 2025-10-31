import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFiles, HttpException, Query, Headers, Res, HttpStatus } from '@nestjs/common';
import { FirebaseAuthGuard } from './infra/auth/FirebaseAuth.guard';
import { CriarCheckoutDto } from './application/dtos/Pagamento.dto';
import { ProcessarWebhookUsecase } from './application/usecases/ProcessarWebhook.usecase';
import { CriarCheckoutUsecase } from './application/usecases/CriarPreferenciaPagamento.usecase';
import { ObterStatusPagamentoUsecase } from './application/usecases/ObterStatusPagamento.usecase';
import type { Response } from 'express';

@Controller('checkout/mercado-pago')
export class PagamentoController {
  constructor(
    private readonly criarPreferenciaPagamentoUsecase: CriarCheckoutUsecase,
    private readonly processarWebhookUsecase: ProcessarWebhookUsecase,
    private readonly obterStatusPagamentoUsecase: ObterStatusPagamentoUsecase,
  ) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('criar')
  async criarCheckout(
    @Body() props: CriarCheckoutDto,
  ): Promise<any> {
      const result = await this.criarPreferenciaPagamentoUsecase.execute(props);

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

  @Post('webhook')
  async processarWebhook(
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string>,
    @Body() body: any,
    @Res() res: Response,
  ): Promise<any> {
    const signature = headers['x-signature'];
    const requestId = headers['x-request-id'];
    const dataId = query['data.id'];

    const result = await this.processarWebhookUsecase.execute({signature, requestId, dataId, body});

    if (result.ehFalha()) {
      return res.status(400).json({
        success: false,
        message: result.erro?.message || 'Erro desconhecido',
      });
    }

    return res.status(HttpStatus.OK).send('OK');
  }

  @Post('status')
  async obterStatusPagamento(@Body('paymentId') paymentId: number): Promise<any> {
    const result = await this.obterStatusPagamentoUsecase.execute(paymentId);
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
}