import { Body, Controller, Post, Get, Param, Patch, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { CriarAluguelUseCase } from './application/usecases/CriarAluguel.usecase';
import { ProcessarWebhookCaucaoUseCase } from './application/usecases/ProcessarWebhookCaucao.usecase';
import { FinalizarAluguelUseCase } from './application/usecases/FinalizarAluguel.usecase';
import { CriarAluguelDto } from './application/dtos/CriarAluguel.dto';
import { FinalizarAluguelDto } from './application/dtos/FinalizarAluguel.dto';

@Controller('aluguel')
export class AluguelController {
  private readonly logger = new Logger(AluguelController.name);

  constructor(
    private readonly criarAluguelUseCase: CriarAluguelUseCase,
    private readonly processarWebhookUseCase: ProcessarWebhookCaucaoUseCase,
    private readonly finalizarAluguelUseCase: FinalizarAluguelUseCase,
  ) {}

  /**
   * Cria um aluguel (com ou sem caução)
   * POST /aluguel/criar
   * 
   * Se o campo `caucao` for informado, cria aluguel com caução
   * Se não informado, cria aluguel sem caução
   */
  @Post('criar')
  @HttpCode(HttpStatus.CREATED)
  async criarAluguel(@Body() dto: CriarAluguelDto) {
    this.logger.log('Recebida requisição para criar aluguel');
    
    try {
      const resultado = await this.criarAluguelUseCase.executar(dto);
      return {
        sucesso: true,
        dados: resultado,
      };
    } catch (error) {
      this.logger.error('Erro ao criar aluguel', error.stack);
      throw error;
    }
  }

  /**
   * Webhook do Mercado Pago para notificações de pagamento
   * POST /aluguel/webhook-caucao
   */
  @Post('webhook-caucao')
  @HttpCode(HttpStatus.OK)
  async webhookCaucao(@Body() webhookData: any) {
    this.logger.log('Webhook recebido do Mercado Pago');
    
    try {
      const resultado = await this.processarWebhookUseCase.executar(webhookData);
      return {
        sucesso: true,
        dados: resultado,
      };
    } catch (error) {
      this.logger.error('Erro ao processar webhook', error.stack);
      // Não lançar erro para não bloquear o Mercado Pago
      return {
        sucesso: false,
        mensagem: 'Erro ao processar webhook',
      };
    }
  }

  /**
   * Finaliza um aluguel e distribui os valores
   * POST /aluguel/finalizar
   */
  @Post('finalizar')
  @HttpCode(HttpStatus.OK)
  async finalizarAluguel(@Body() dto: FinalizarAluguelDto) {
    this.logger.log(`Recebida requisição para finalizar aluguel ${dto.aluguelId}`);
    
    try {
      const resultado = await this.finalizarAluguelUseCase.executar(dto);
      return {
        sucesso: true,
        dados: resultado,
      };
    } catch (error) {
      this.logger.error('Erro ao finalizar aluguel', error.stack);
      throw error;
    }
  }
}
