import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoService } from '../../infra/services/mercado-pago.service';

export interface CriarPreferenciaCaucaoParams {
  aluguelId: string;
  valorCaucao: number;
  locatarioEmail: string;
  itemNome: string;
}
export interface CriarPreferenciaAluguelParams {
  aluguelId: string;
  valorAluguel: number;
  locatarioEmail: string;
  itemNome: string;
}
export interface CriarPreferenciaVendaParams {
  aluguelId: string;
  valorVenda: number;
  locatarioEmail: string;
  itemNome: string;
}

@Injectable()
export class MercadoPagoCheckoutService {
  private readonly logger = new Logger(MercadoPagoCheckoutService.name);

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  /**
   * Cria preferência de pagamento para caução (escrow)
   */
  async criarPreferenciaCaucao(params: CriarPreferenciaCaucaoParams) {
    this.logger.log(
      `Criando preferência de caução para aluguel ${params.aluguelId}`,
    );

    const preferencia = await this.mercadoPagoService.criarPreferenciaPagamento(
      {
        aluguelId: params.aluguelId,
        valor: params.valorCaucao,
        itemNome: `Caução - ${params.itemNome}`,
        itemDescricao: `Caução de garantia para aluguel do item ${params.itemNome}`,
        locatarioEmail: params.locatarioEmail,
        tipo: 'caucao',
      },
    );

    return preferencia;
  }
  /**
   * Cria preferência de pagamento para caução (escrow)
   */
  async criarPreferenciaAluguel(params: CriarPreferenciaAluguelParams) {
    this.logger.log(
      `Criando preferência de aluguel para aluguel ${params.aluguelId}`,
    );

    const preferencia = await this.mercadoPagoService.criarPreferenciaPagamento(
      {
        aluguelId: params.aluguelId,
        valor: params.valorAluguel,
        itemNome: `Aluguel - ${params.itemNome}`,
        itemDescricao: `Aluguel do item ${params.itemNome}`,
        locatarioEmail: params.locatarioEmail,
        tipo: 'aluguel',
      },
    );

    return preferencia;
  }
  /**
   * Cria preferência de pagamento para caução (escrow)
   */
  async criarPreferenciaVenda(params: CriarPreferenciaVendaParams) {
    this.logger.log(
      `Criando preferência de venda para aluguel ${params.aluguelId}`,
    );

    const preferencia = await this.mercadoPagoService.criarPreferenciaPagamento(
      {
        aluguelId: params.aluguelId,
        valor: params.valorVenda,
        itemNome: `Venda - ${params.itemNome}`,
        itemDescricao: `Venda do item ${params.itemNome}`,
        locatarioEmail: params.locatarioEmail,
        tipo: 'venda',
      },
    );

    return preferencia;
  }

  /**
   * Obtém status de um pagamento
   */
  async obterStatusPagamento(paymentId: number) {
    return this.mercadoPagoService.obterStatusPagamento(paymentId);
  }
}
