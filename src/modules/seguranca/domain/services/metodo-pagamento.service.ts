import { Injectable, Logger } from '@nestjs/common';
import { MetodoPagamento } from '../Caucao';

export interface DadosPagamentoMP {
  id: number;
  payment_method_id?: string;
  payment_type_id?: string;
  status: string;
}

@Injectable()
export class MetodoPagamentoService {
  private readonly logger = new Logger(MetodoPagamentoService.name);

  /**
   * Detecta o método de pagamento baseado nos dados do Mercado Pago
   */
  detectarMetodoPagamento(dadosPagamento: DadosPagamentoMP): MetodoPagamento {
    const paymentMethodId = dadosPagamento.payment_method_id?.toLowerCase();
    const paymentTypeId = dadosPagamento.payment_type_id?.toLowerCase();

    this.logger.log(`Detectando método de pagamento: ${paymentMethodId}`);

    // Mapeamento de payment_method_id para tipo
    const mapeamento: Record<string, MetodoPagamento> = {
      // Cartões
      'visa': MetodoPagamento.CARTAO_CREDITO,
      'mastercard': MetodoPagamento.CARTAO_CREDITO,
      'amex': MetodoPagamento.CARTAO_CREDITO,
      'elo': MetodoPagamento.CARTAO_CREDITO,
      'hipercard': MetodoPagamento.CARTAO_CREDITO,
      'credit_card': MetodoPagamento.CARTAO_CREDITO,

      // Cartão débito
      'debit_card': MetodoPagamento.CARTAO_DEBITO,

      // Pix
      'pix': MetodoPagamento.PIX,

      // Boleto
      'bolbradesco': MetodoPagamento.BOLETO,
      'boleto': MetodoPagamento.BOLETO,

      // Account Money (saldo em conta)
      'account_money': MetodoPagamento.ACCOUNT_MONEY,
    };

    if (paymentMethodId && mapeamento[paymentMethodId]) {
      const metodo = mapeamento[paymentMethodId];
      this.logger.log(`✅ Método detectado: ${metodo}`);
      return metodo;
    }

    // Tentar pelo payment_type_id
    if (paymentTypeId === 'credit_card' || paymentTypeId === 'card') {
      return MetodoPagamento.CARTAO_CREDITO;
    }

    if (paymentTypeId === 'debit_card') {
      return MetodoPagamento.CARTAO_DEBITO;
    }

    this.logger.warn(`⚠️ Método de pagamento não identificado: ${paymentMethodId}`);
    return MetodoPagamento.DESCONHECIDO;
  }

  /**
   * Verifica se o método suporta reembolso direto
   * Cartão de crédito geralmente suporta, mas pode levar 3-10 dias úteis
   */
  suportaReembolsoDireto(metodo: MetodoPagamento): boolean {
    return [
      MetodoPagamento.CARTAO_CREDITO,
      MetodoPagamento.CARTAO_DEBITO,
      MetodoPagamento.PIX,
      MetodoPagamento.ACCOUNT_MONEY,
    ].includes(metodo);
  }

  /**
   * Calcula tempo estimado de reembolso
   */
  tempoEstimadoReembolso(metodo: MetodoPagamento): string {
    switch (metodo) {
      case MetodoPagamento.PIX:
        return 'Até 24 horas (geralmente instantâneo)';
      case MetodoPagamento.ACCOUNT_MONEY:
        return 'Até 24 horas';
      case MetodoPagamento.CARTAO_DEBITO:
        return 'Até 2 dias úteis';
      case MetodoPagamento.CARTAO_CREDITO:
        return 'Até 10 dias úteis (próxima fatura)';
      case MetodoPagamento.BOLETO:
        return 'Não suporta reembolso automático - Manual necessária';
      default:
        return 'Desconhecido';
    }
  }

  /**
   * Determina se precisa usar Pix para devolver (para cartão de crédito)
   */
  precisaUsarPixParaDevolver(metodo: MetodoPagamento): boolean {
    // Se pagou via cartão, precisamos de Pix para devolver rápido
    // Senão, esperar reembolso automático
    return metodo === MetodoPagamento.CARTAO_CREDITO || metodo === MetodoPagamento.BOLETO;
  }

  /**
   * Gera mensagem de reembolso baseada no método de pagamento
   */
  gerarMensagemReembolso(metodo: MetodoPagamento, valor: number): string {
    const valorFormatado = `R$ ${valor.toFixed(2)}`;

    switch (metodo) {
      case MetodoPagamento.PIX:
        return `✅ Seu reembolso de ${valorFormatado} será creditado via Pix em até 24 horas.`;

      case MetodoPagamento.ACCOUNT_MONEY:
        return `✅ Seu reembolso de ${valorFormatado} será creditado em sua conta do Mercado Pago em até 24 horas.`;

      case MetodoPagamento.CARTAO_DEBITO:
        return `⏳ Seu reembolso de ${valorFormatado} voltará ao seu cartão de débito em até 2 dias úteis.`;

      case MetodoPagamento.CARTAO_CREDITO:
        return `⏳ Seu reembolso de ${valorFormatado} será creditado na próxima fatura do seu cartão de crédito (até 10 dias úteis).`;

      case MetodoPagamento.BOLETO:
        return `⏳ Seu reembolso de ${valorFormatado} será processado manualmente. Aguarde contato.`;

      default:
        return `⏳ Seu reembolso de ${valorFormatado} será processado em breve.`;
    }
  }

  /**
   * Determina a estratégia de reembolso
   */
  definirEstrategiaReembolso(metodo: MetodoPagamento): {
    tipo: 'automatico' | 'manual' | 'pix';
    descricao: string;
    tempoEstimado: string;
  } {
    switch (metodo) {
      case MetodoPagamento.PIX:
      case MetodoPagamento.ACCOUNT_MONEY:
        return {
          tipo: 'automatico',
          descricao: 'Reembolso automático instantâneo',
          tempoEstimado: 'Até 24 horas',
        };

      case MetodoPagamento.CARTAO_DEBITO:
        return {
          tipo: 'automatico',
          descricao: 'Reembolso automático para o cartão',
          tempoEstimado: 'Até 2 dias úteis',
        };

      case MetodoPagamento.CARTAO_CREDITO:
        return {
          tipo: 'pix',
          descricao: 'Reembolso via Pix (mais rápido que volta ao cartão)',
          tempoEstimado: 'Até 24 horas (se Pix fornecido) ou até 10 dias (cartão)',
        };

      case MetodoPagamento.BOLETO:
      default:
        return {
          tipo: 'manual',
          descricao: 'Reembolso manual necessário',
          tempoEstimado: 'Conforme processamento',
        };
    }
  }
}
