import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';

export interface CriarPreferenciaCaucaoParams {
  aluguelId: string;
  valorCaucao: number;
  locatarioEmail: string;
  itemNome: string;
}

@Injectable()
export class MercadoPagoCheckoutService {
  private readonly logger = new Logger(MercadoPagoCheckoutService.name);

  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  /**
   * Cria preferência de pagamento para caução (escrow)
   */
  async criarPreferenciaCaucao(params: CriarPreferenciaCaucaoParams) {
    this.logger.log(`Criando preferência de caução para aluguel ${params.aluguelId}`);

    const preferencia = await this.mercadoPagoService.criarPreferenciaPagamento({
      aluguelId: params.aluguelId,
      valor: params.valorCaucao,
      itemNome: `Caução - ${params.itemNome}`,
      itemDescricao: `Caução de garantia para aluguel do item ${params.itemNome}`,
      locatarioEmail: params.locatarioEmail,
    });

    return preferencia;
  }

  /**
   * Obtém status de um pagamento
   */
  async obterStatusPagamento(paymentId: number) {
    return this.mercadoPagoService.obterStatusPagamento(paymentId);
  }
}

//   /**
//    * Cria um checkout de pagamento no Mercado Pago
//    */
//   async criarCheckout(dto: CriarCheckoutMercadoPagoDto) {
//     try {
//       this.logger.log(`Iniciando criação de checkout para aluguel ${dto.aluguelId}`);

//       // Aqui você pode adicionar lógica adicional, como:
//       // 1. Verificar se o aluguel existe
//       // 2. Validar se o aluguel já foi pago
//       // 3. Registrar o pagamento pendente no banco

//       const preferencia = await this.mercadoPagoIntegration.criarPreferenciaPagamento({
//         aluguelId: dto.aluguelId,
//         valor: dto.valor,
//         itemNome: dto.itemNome,
//         itemDescricao: dto.itemDescricao || 'Pagamento de aluguel',
//         locatarioEmail: dto.locatarioEmail,
//         locatarioNome: dto.locatarioNome,
//         locatarioTelefone: dto.locatarioTelefone,
//       });

//       this.logger.log(`Checkout criado com sucesso: ${preferencia.id}`);
 
//       return {
//         id: preferencia.id,
//         init_point: preferencia.init_point,
//         sandbox_init_point: preferencia.sandbox_init_point,
//         // URL para redirecionar o usuário
//         url: preferencia.init_point || preferencia.sandbox_init_point,
//       };
//     } catch (error) {
//       this.logger.error(`Erro ao criar checkout: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Processa webhook do Mercado Pago
//    */
//   async processarWebhook(webhookData: any) {
//     try {
//       // Validar webhook
//       if (!this.mercadoPagoIntegration.validarWebhook(webhookData)) {
//         this.logger.warn('Webhook inválido recebido');
//         return null;
//       }

//       const notificacao = this.mercadoPagoIntegration.processarWebhook(webhookData);

//       if (!notificacao) {
//         return null;
//       }

//       if (notificacao.tipo === 'pagamento') {
//         await this.processarNotificacaoPagamento(notificacao);
//       } else if (notificacao.tipo === 'pedido') {
//         await this.processarNotificacaoPedido(notificacao);
//       }

//       return notificacao;
//     } catch (error) {
//       this.logger.error(`Erro ao processar webhook: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Processa notificação de pagamento
//    */
//   private async processarNotificacaoPagamento(notificacao: any) {
//     try {
//       this.logger.log(`Processando pagamento ${notificacao.paymentId}`);

//       // Obter detalhes do pagamento
//       const pagamento = await this.mercadoPagoIntegration.obterStatusPagamento(
//         notificacao.paymentId,
//       );

//       const aluguelId = pagamento.external_reference;

//       if (!aluguelId) {
//         this.logger.warn(`Pagamento ${notificacao.paymentId} sem external_reference`);
//         return;
//       }

//       // Aqui você deve:
//       // 1. Buscar o aluguel no banco
//       // 2. Atualizar o status do pagamento
//       // 3. Desbloquear recursos se pagamento aprovado
//       // 4. Enviar notificação ao usuário

//       this.logger.log(
//         `Aluguel ${aluguelId}: Status do pagamento ${pagamento.status} (${pagamento.status_detail})`,
//       );

//       // Exemplo de como fazer isso:
//       // const aluguel = await this.aluguelRepository.findOne({ where: { id: aluguelId } });
//       // if (aluguel) {
//       //   aluguel.statusPagamento = this.mercadoPagoIntegration.mapearStatusPagamento(pagamento.status);
//       //   aluguel.pagamentoId = pagamento.id;
//       //   await this.aluguelRepository.save(aluguel);
//       // }
//     } catch (error) {
//       this.logger.error(`Erro ao processar notificação de pagamento: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Processa notificação de pedido
//    */
//   private async processarNotificacaoPedido(notificacao: any) {
//     try {
//       this.logger.log(`Processando pedido ${notificacao.orderId}`);
//       // Implementar lógica se necessário
//     } catch (error) {
//       this.logger.error(`Erro ao processar notificação de pedido: ${error.message}`);
//       throw error;
//     }
//   }

//   /**
//    * Obtém o status de um pagamento
//    */
//   async obterStatusPagamento(paymentId: number) {
//     try {
//       const pagamento = await this.mercadoPagoIntegration.obterStatusPagamento(paymentId);
//       return this.mercadoPagoIntegration.formatarRespostaPagamento(pagamento);
//     } catch (error) {
//       this.logger.error(`Erro ao obter status do pagamento: ${error.message}`);
//       throw error;
//     }
//   }
// }
