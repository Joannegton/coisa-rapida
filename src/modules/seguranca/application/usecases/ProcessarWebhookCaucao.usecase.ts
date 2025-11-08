import { Injectable, Logger } from '@nestjs/common';
import { StatusCaucao } from '../../domain/Caucao';
import { StatusAluguel } from '../../domain/Aluguel';
import { AluguelRepository } from '../../infra/repositories/Aluguel.repository';
import { CaucaoRepository } from '../../infra/repositories/Caucao.repository';
import { MercadoPagoCheckoutService } from '../../infra/services/mercado-pago-checkout.service';

@Injectable()
export class ProcessarWebhookCaucaoUseCase {
  private readonly logger = new Logger(ProcessarWebhookCaucaoUseCase.name);

  constructor(
    private readonly aluguelRepository: AluguelRepository,
    private readonly caucaoRepository: CaucaoRepository,
    private readonly mercadoPagoService: MercadoPagoCheckoutService,
  ) {}

  async executar(webhookData: any): Promise<{ processado: boolean; mensagem: string }> {
    try {
      this.logger.log('Processando webhook do Mercado Pago', JSON.stringify(webhookData));

      // Extrair informações do webhook (formato pode variar)
      const topic = webhookData.type || webhookData.topic || webhookData.data?.type;
      const paymentId = webhookData.data?.id || webhookData['data.id'] || webhookData.id;

      if (!paymentId) {
        this.logger.warn('Webhook recebido sem payment ID');
        return { processado: false, mensagem: 'Payment ID não encontrado' };
      }

      this.logger.log(`Processando pagamento ID: ${paymentId}`);

      // Obter detalhes do pagamento do Mercado Pago
      const resultadoPagamento = await this.mercadoPagoService.obterStatusPagamento(Number(paymentId));
      
      if (resultadoPagamento.ehFalha()) {
        this.logger.error('Falha ao obter status do pagamento', resultadoPagamento.erro?.message);
        return { processado: false, mensagem: 'Erro ao obter dados do pagamento' };
      }

      const mpPayment = resultadoPagamento.valor!;
      const status = mpPayment.status;
      const externalRef = mpPayment.external_reference;

      this.logger.log(`Status do pagamento: ${status}, External reference: ${externalRef}`);

      // Buscar caução pelo payment ID
      const caucao = await this.caucaoRepository.buscarPorPaymentId(String(paymentId));
      
      if (!caucao) {
        this.logger.warn(`Caução não encontrada para payment ID: ${paymentId}`);
        return { processado: false, mensagem: 'Caução não encontrada' };
      }

      // Buscar aluguel relacionado
      const aluguel = await this.aluguelRepository.buscarPorId(caucao.aluguelId);

      if (!aluguel) {
        this.logger.error(`Aluguel ${caucao.aluguelId} não encontrado`);
        return { processado: false, mensagem: 'Aluguel não encontrado' };
      }

      // Processar status do pagamento
      if (status === 'approved') {
        // Pagamento aprovado - atualizar caução e aluguel
        caucao.atualizarStatus(StatusCaucao.PAGA, mpPayment);
        await this.caucaoRepository.atualizar(caucao);

        aluguel.atualizarStatusPagamento(String(paymentId));
        await this.aluguelRepository.atualizar(aluguel);

        this.logger.log(`Caução paga com sucesso para aluguel ${aluguel.id}`);
        
        // TODO: Enviar notificações para locador e locatário
        
        return { 
          processado: true, 
          mensagem: `Caução do aluguel ${aluguel.id} foi paga com sucesso` 
        };
      } else if (status === 'rejected' || status === 'cancelled') {
        // Pagamento rejeitado/cancelado
        caucao.atualizarStatus(StatusCaucao.CANCELADA, mpPayment);
        await this.caucaoRepository.atualizar(caucao);

        this.logger.log(`Pagamento rejeitado/cancelado para aluguel ${aluguel.id}`);
        
        return { 
          processado: true, 
          mensagem: `Pagamento da caução foi ${status}` 
        };
      } else if (status === 'pending' || status === 'in_process') {
        // Pagamento pendente
        caucao.atualizarStatus(StatusCaucao.PROCESSANDO, mpPayment);
        await this.caucaoRepository.atualizar(caucao);

        this.logger.log(`Pagamento em processamento para aluguel ${aluguel.id}`);
        
        return { 
          processado: true, 
          mensagem: 'Pagamento em processamento' 
        };
      }

      this.logger.log(`Status não tratado: ${status}`);
      return { processado: false, mensagem: `Status ${status} não tratado` };

    } catch (error) {
      this.logger.error('Erro ao processar webhook', error.stack);
      throw error;
    }
  }
}
