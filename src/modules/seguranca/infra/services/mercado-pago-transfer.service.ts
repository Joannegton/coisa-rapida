import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';

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

export interface DadosTransferenciaManual {
  valor: number;
  destinatario: string;
  chavePix?: string;
  descricao: string;
}

@Injectable()
export class MercadoPagoTransferService {
  private readonly logger = new Logger(MercadoPagoTransferService.name);
  private readonly apiUrl = 'https://api.mercadopago.com';
  private readonly accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';

  /**
   * Gera instruções para transferência manual (Pix/TED)
   * Para MVP com conta PF - Locador recebe por transferência manual
   */
  gerarInstrucoesTransferenciaManual(params: DadosTransferenciaManual): {
    instrucoes: string;
    dados: DadosTransferenciaManual;
  } {
    this.logger.log(`Gerando instruções para transferência de R$ ${params.valor.toFixed(2)} para ${params.destinatario}`);

    const instrucoes = params.chavePix
      ? `Transferir R$ ${params.valor.toFixed(2)} via Pix para ${params.destinatario} (Chave: ${params.chavePix})`
      : `Transferir R$ ${params.valor.toFixed(2)} para ${params.destinatario}`;

    return {
      instrucoes,
      dados: params,
    };
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
