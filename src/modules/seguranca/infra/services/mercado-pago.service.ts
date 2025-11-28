import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import {
  ResultadoAssincrono,
  ResultadoUtil,
  ServicoExcecao,
} from '../../../../shared/resultado';
import MercadoPagoConfig, { Preference } from 'mercadopago';
import { PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes';

export interface PreferenciaPagamentoProps {
  aluguelId: string;
  valor: number;
  itemNome: string;
  itemDescricao: string;
  locatarioEmail: string;
  locatarioNome?: string;
  locatarioTelefone?: string;
  tipo: 'aluguel' | 'venda' | 'caucao';
}

export interface PagamentoStatusResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference: string;
  payment_method_id?: string;
  payment_type_id?: string;
  payment_method?: {
    id?: string;
    type?: string;
  };
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly apiUrl = 'https://api.mercadopago.com';
  private readonly client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  });
  private readonly preference = new Preference(this.client);

  /**
   * Cria uma preferência de pagamento no Mercado Pago
   */
  async criarPreferenciaPagamento(
    props: PreferenciaPagamentoProps,
  ): ResultadoAssincrono<PreferenceResponse, ServicoExcecao> {
    try {
      const external_reference = `${props.aluguelId}, ${props.tipo}`;
      const preference = {
        items: [
          {
            id: props.aluguelId,
            title: props.itemNome,
            description: props.itemDescricao,
            quantity: 1,
            unit_price: parseFloat(props.valor.toString()),
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: props.locatarioEmail,
          name: props.locatarioNome,
          phone: props.locatarioTelefone
            ? { number: props.locatarioTelefone }
            : undefined,
        },
        external_reference: external_reference,
        back_urls: {
          success: `coisarapida://success`,
          failure: `coisarapida://failure`,
          pending: `coisarapida://pending`,
        },
        auto_return: 'approved',
        statement_descriptor: 'COISARAPIDA',
        notification_url: `${process.env.API_URL || 'http://localhost:3000'}/checkout/mercado-pago/webhook`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 dias
      };

      const result = await this.preference.create({
        body: preference,
      });

      return ResultadoUtil.sucesso(result);
    } catch (error) {
      this.logger.error(
        `Erro ao criar preferência de pagamento: ${error.response?.data?.message || error.message}`,
      );
      return ResultadoUtil.falha(
        new ServicoExcecao('Erro ao criar preferência de pagamento'),
      );
    }
  }

  /**
   * Obtém o status de um pagamento
   */
  async obterStatusPagamento(
    paymentId: number,
  ): ResultadoAssincrono<PagamentoStatusResponse, ServicoExcecao> {
    try {
      const response = await axios.get<PagamentoStatusResponse>(
        `${this.apiUrl}/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN || ''}`,
          },
        },
      );

      return ResultadoUtil.sucesso(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao obter status do pagamento ${paymentId}: ${error.response?.data?.message || error.message}`,
      );
      return ResultadoUtil.falha(
        new ServicoExcecao('Erro ao obter status do pagamento'),
      );
    }
  }

  /**
   * Processa uma notificação de webhook do Mercado Pago
   */
  processarWebhook(webhookData: any) {
    const { type, data, action } = webhookData;

    this.logger.debug(`Webhook recebido - Tipo: ${type}, Action: ${action}`);

    // Mercado Pago envia notificações de diferentes tipos
    if (type === 'payment' && data?.id) {
      return {
        tipo: 'pagamento',
        paymentId: data.id,
        action,
      };
    } else if (type === 'merchant_order' && data?.id) {
      return {
        tipo: 'pedido',
        orderId: data.id,
        action,
      };
    }

    return null;
  }

  /**
   * Valida o webhook do Mercado Pago
   * Verifica se a notificação é autêntica
   */
  validarWebhook(webhookData: any): boolean {
    // Mercado Pago sempre envia com type e data
    return (
      webhookData &&
      (webhookData.type === 'payment' || webhookData.type === 'merchant_order')
    );
  }

  /**
   * Mapa de status do Mercado Pago para status interno
   */
  mapearStatusPagamento(statusMercadoPago: string): string {
    const mapa: Record<string, string> = {
      pending: 'pendente',
      approved: 'aprovado',
      authorized: 'autorizado',
      in_process: 'processando',
      in_mediation: 'em_mediacao',
      rejected: 'rejeitado',
      cancelled: 'cancelado',
      refunded: 'reembolsado',
      charged_back: 'estornado',
    };

    return mapa[statusMercadoPago] || 'desconhecido';
  }

  /**
   * Formata uma resposta de pagamento para o padrão da aplicação
   */
  formatarRespostaPagamento(pagamento: PagamentoStatusResponse) {
    return {
      id: pagamento.id,
      externalReference: pagamento.external_reference,
      status: this.mapearStatusPagamento(pagamento.status),
      statusMercadoPago: pagamento.status,
      statusDetalhado: pagamento.status_detail,
      valor: pagamento.transaction_amount,
      email: pagamento.payer.email,
      documento: pagamento.payer.identification?.number,
    };
  }
}
