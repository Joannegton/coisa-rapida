import { Injectable, Logger } from '@nestjs/common';
import { StatusCaucao, MetodoPagamento } from '../../domain/Caucao';
import { AluguelRepository } from '../../infra/repositories/Aluguel.repository';
import { MercadoPagoCheckoutService } from '../services/mercado-pago-checkout.service';
import { MetodoPagamentoService } from '../../domain/services/metodo-pagamento.service';

@Injectable()
export class ProcessarWebhookCaucaoUseCase {
  private readonly logger = new Logger(ProcessarWebhookCaucaoUseCase.name);

  constructor(
    private readonly aluguelRepository: AluguelRepository,
    private readonly mercadoPagoService: MercadoPagoCheckoutService,
    private readonly metodoPagamentoService: MetodoPagamentoService,
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

      const pagamentoResult = await this.mercadoPagoService.obterStatusPagamento(Number(paymentId));
      
      if (pagamentoResult.ehFalha()) {
        this.logger.error('Falha ao obter status do pagamento', pagamentoResult.erro?.message);
        return { processado: false, mensagem: 'Erro ao obter dados do pagamento' };
      }

      const mpPayment = pagamentoResult.valor!;
      const status = mpPayment.status;
      const externalRef = mpPayment.external_reference;

      this.logger.log(`Status do pagamento: ${status}, External reference: ${externalRef}`);

      // 🔍 Detectar método de pagamento
      const metodoPagamento = this.metodoPagamentoService.detectarMetodoPagamento({
        id: mpPayment.id,
        payment_method_id: mpPayment.payment_method_id || mpPayment.payment_method?.id,
        payment_type_id: mpPayment.payment_type_id,
        status: status,
      });
      
      this.logger.log(`💳 Método de pagamento detectado: ${metodoPagamento}`);

      // Buscar caução pelo payment ID
      const aluguelResult = await this.aluguelRepository.buscarPorPaymentId(String(paymentId));
      
      if (aluguelResult.ehFalha()) {
        this.logger.warn(`Caução não encontrada para payment ID: ${paymentId}`);
        return { processado: false, mensagem: aluguelResult.erro!.message };
      }

      // Processar status do pagamento
      if (status === 'approved') {
        // Pagamento aprovado - atualizar caução e aluguel
        aluguelResult.valor?.atualizarStatusPagamentoCaucao(StatusCaucao.PAGA, mpPayment);
        aluguelResult.valor?.definirMetodoPagamentoCaucao(metodoPagamento); // 💳 Guardar método detectado

        aluguelResult.valor?.atualizarStatusPagamento(String(paymentId));

        await this.aluguelRepository.salvar(aluguelResult.valor!);

        this.logger.log(`Caução paga com sucesso para aluguel ${aluguelResult.valor!.id}`);
        
        // TODO: Enviar notificações para locador e locatário
        
        return { 
          processado: true, 
          mensagem: `Caução do aluguel ${aluguelResult.valor!.id} foi paga com sucesso` 
        };
      } else if (status === 'rejected' || status === 'cancelled') {
        aluguelResult.valor?.atualizarStatusPagamentoCaucao(StatusCaucao.CANCELADA, mpPayment);
        await this.aluguelRepository.salvar(aluguelResult.valor!);

        this.logger.log(`Pagamento rejeitado/cancelado para aluguel ${aluguelResult.valor!.id}`);
        
        // TODO: Enviar notificações para locador e locatário
        return { 
          processado: true, 
          mensagem: `Pagamento da caução foi ${status}` 
        };
      } else if (status === 'pending' || status === 'in_process') {
        // Pagamento pendente
        aluguelResult.valor?.atualizarStatusPagamentoCaucao(StatusCaucao.PROCESSANDO, mpPayment);
        await this.aluguelRepository.salvar(aluguelResult.valor!);

        this.logger.log(`Pagamento em processamento para aluguel ${aluguelResult.valor!.id}`);

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
