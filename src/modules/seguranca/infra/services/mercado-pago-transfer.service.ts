import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';

export interface TransferenciaParams {
  valor: number;
  contaDestinoId: string;
  descricao: string;
  externalReference?: string;
}

export interface TransferenciaResponse {
  id: number;
  status: string;
  amount: number;
  receiver_id: string;
  date_created: string;
}

export interface ReembolsoParams {
  paymentId: string;
  valor?: number; // Se não informado, reembolsa total
  motivo?: string;
}

export interface ReembolsoResponse {
  id: number;
  payment_id: number;
  amount: number;
  status: string;
  date_created: string;
}

@Injectable()
export class MercadoPagoTransferService {
  private readonly logger = new Logger(MercadoPagoTransferService.name);
  private readonly apiUrl = 'https://api.mercadopago.com';
  private readonly accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

  /**
   * Realiza uma transferência para uma conta do Mercado Pago
   * Usado para transferir valores para locador
   */
  async transferir(params: TransferenciaParams): ResultadoAssincrono<TransferenciaResponse, ServicoExcecao> {
    try {
      this.logger.log(`Iniciando transferência de R$ ${params.valor.toFixed(2)} para ${params.contaDestinoId}`);

      // API de Money Transfer do Mercado Pago
      const response = await axios.post<TransferenciaResponse>(
        `${this.apiUrl}/v1/advanced_payments`,
        {
          application_id: process.env.MERCADO_PAGO_APP_ID,
          payments: [
            {
              payment_method_id: 'account_money',
              payment_type_id: 'account_money',
              transaction_amount: Number(params.valor.toFixed(2)),
              description: params.descricao,
              collector: {
                id: params.contaDestinoId,
              },
            },
          ],
          external_reference: params.externalReference,
          disbursements: [
            {
              amount: Number(params.valor.toFixed(2)),
              collector_id: params.contaDestinoId,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Transferência realizada com sucesso: ${response.data.id}`);
      return ResultadoUtil.sucesso(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao realizar transferência: ${error.response?.data?.message || error.message}`,
        error.response?.data
      );
      return ResultadoUtil.falha(
        new ServicoExcecao(`Erro ao transferir valor: ${error.response?.data?.message || error.message}`)
      );
    }
  }

  /**
   * Realiza reembolso de um pagamento
   * Usado para devolver valores ao locatário
   */
  async reembolsar(params: ReembolsoParams): ResultadoAssincrono<ReembolsoResponse, ServicoExcecao> {
    try {
      this.logger.log(`Iniciando reembolso do pagamento ${params.paymentId}`);

      const body: any = {};
      
      if (params.valor) {
        body.amount = Number(params.valor.toFixed(2));
      }
      
      if (params.motivo) {
        body.metadata = { motivo: params.motivo };
      }

      const response = await axios.post<ReembolsoResponse>(
        `${this.apiUrl}/v1/payments/${params.paymentId}/refunds`,
        body,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Reembolso realizado com sucesso: ${response.data.id}`);
      return ResultadoUtil.sucesso(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao realizar reembolso: ${error.response?.data?.message || error.message}`,
        error.response?.data
      );
      return ResultadoUtil.falha(
        new ServicoExcecao(`Erro ao reembolsar valor: ${error.response?.data?.message || error.message}`)
      );
    }
  }

  /**
   * Split payment - Divide o pagamento entre múltiplos recebedores
   * Alternativa mais simples usando split direto na preferência
   */
  async criarPagamentoComSplit(params: {
    valorTotal: number;
    splits: Array<{
      contaId: string;
      valor: number;
      descricao: string;
    }>;
    externalReference: string;
  }): ResultadoAssincrono<any, ServicoExcecao> {
    try {
      this.logger.log(`Criando pagamento com split de R$ ${params.valorTotal.toFixed(2)}`);

      const response = await axios.post(
        `${this.apiUrl}/v1/advanced_payments`,
        {
          application_id: process.env.MERCADO_PAGO_APP_ID,
          payments: params.splits.map(split => ({
            payment_method_id: 'account_money',
            payment_type_id: 'account_money',
            transaction_amount: Number(split.valor.toFixed(2)),
            description: split.descricao,
            collector: {
              id: split.contaId,
            },
          })),
          external_reference: params.externalReference,
          disbursements: params.splits.map(split => ({
            amount: Number(split.valor.toFixed(2)),
            collector_id: split.contaId,
          })),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Pagamento com split criado: ${response.data.id}`);
      return ResultadoUtil.sucesso(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao criar pagamento com split: ${error.response?.data?.message || error.message}`,
        error.response?.data
      );
      return ResultadoUtil.falha(
        new ServicoExcecao(`Erro ao criar split: ${error.response?.data?.message || error.message}`)
      );
    }
  }

  /**
   * Consulta status de uma transferência
   */
  async consultarTransferencia(transferenciaId: number): ResultadoAssincrono<any, ServicoExcecao> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v1/advanced_payments/${transferenciaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return ResultadoUtil.sucesso(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao consultar transferência: ${error.response?.data?.message || error.message}`
      );
      return ResultadoUtil.falha(
        new ServicoExcecao('Erro ao consultar transferência')
      );
    }
  }

  /**
   * Consulta status de um reembolso
   */
  async consultarReembolso(paymentId: string, refundId: number): ResultadoAssincrono<any, ServicoExcecao> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v1/payments/${paymentId}/refunds/${refundId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      return ResultadoUtil.sucesso(response.data);
    } catch (error) {
      this.logger.error(
        `Erro ao consultar reembolso: ${error.response?.data?.message || error.message}`
      );
      return ResultadoUtil.falha(
        new ServicoExcecao('Erro ao consultar reembolso')
      );
    }
  }
}
