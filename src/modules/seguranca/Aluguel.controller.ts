import { Body, Controller, Post, Get, Param, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { CriarCaucaoAluguelUseCase } from './application/usecases/CriarCaucaoAluguel.usecase';
import { ProcessarWebhookCaucaoUseCase } from './application/usecases/ProcessarWebhookCaucao.usecase';
import { FinalizarAluguelUseCase } from './application/usecases/FinalizarAluguel.usecase';
import { TransferenciaRepository } from './infra/repositories/Transferencia.repository';
import { CriarCaucaoDto } from './application/dtos/CriarCaucao.dto';
import { FinalizarAluguelDto } from './application/dtos/FinalizarAluguel.dto';

@Controller('aluguel')
export class AluguelController {
  private readonly logger = new Logger(AluguelController.name);

  constructor(
    private readonly criarCaucaoUseCase: CriarCaucaoAluguelUseCase,
    private readonly processarWebhookUseCase: ProcessarWebhookCaucaoUseCase,
    private readonly finalizarAluguelUseCase: FinalizarAluguelUseCase,
    private readonly transferenciaRepository: TransferenciaRepository,
  ) {}

  /**
   * Cria uma caução para um novo aluguel
   * POST /aluguel/criar-caucao
   */
  @Post('criar-caucao')
  @HttpCode(HttpStatus.CREATED)
  async criarCaucao(@Body() dto: CriarCaucaoDto) {
    this.logger.log('Recebida requisição para criar caução');
    
    try {
      const resultado = await this.criarCaucaoUseCase.executar(dto);
      return {
        sucesso: true,
        dados: resultado,
      };
    } catch (error) {
      this.logger.error('Erro ao criar caução', error.stack);
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

  /**
   * Consulta histórico de transferências de um aluguel
   * GET /aluguel/:aluguelId/transferencias
   */
  @Get(':aluguelId/transferencias')
  @HttpCode(HttpStatus.OK)
  async consultarTransferencias(@Param('aluguelId') aluguelId: string) {
    this.logger.log(`Consultando transferências do aluguel ${aluguelId}`);
    
    try {
      const transferencias = await this.transferenciaRepository.buscarPorAluguelId(aluguelId);
      
      return {
        sucesso: true,
        dados: {
          aluguelId,
          total: transferencias.length,
          transferencias: transferencias.map(t => ({
            id: t.id,
            tipo: t.tipo,
            valor: t.valor,
            destinatario: t.nomeDestino,
            status: t.status,
            descricao: t.descricao,
            mpTransferenciaId: t.mpTransferenciaId,
            mpRefundId: t.mpRefundId,
            errorMessage: t.errorMessage,
            createdAt: t.createdAt,
            completedAt: t.completedAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error('Erro ao consultar transferências', error.stack);
      throw error;
    }
  }
}
