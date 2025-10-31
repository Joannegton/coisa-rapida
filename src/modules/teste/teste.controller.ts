import { Body, Controller, Get, Headers, HttpStatus, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TesteService } from './teste.service';

@Controller('teste')
export class TesteController {
  constructor(private readonly appService: TesteService) {}

  @Get()
  async getPreferencia() {  // Alterado para async
    try {
      const preference = await this.appService.getPreferencia();
      return { message: 'Preferência criada com sucesso!', data: preference };  // Retorna dados da preferência
    } catch (error) {
      return { message: 'Erro ao criar preferência', error: error.message };
    }
  }

  @Post('webhook')
  async webHook(
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string>,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const signature = headers['x-signature'];
    const requestId = headers['x-request-id'];
    const dataId = query['data.id'];

    const result = await this.appService.webHook(signature, requestId, dataId, body);

    if (!result.isValid) {
      const status = result.message === 'Parâmetros faltando' ? HttpStatus.BAD_REQUEST : HttpStatus.UNAUTHORIZED;
      res.status(status).send(result.message);
      return;
    }

    // Responde rápido para o Mercado Pago
    res.status(HttpStatus.OK).send(result.message);
  }
}