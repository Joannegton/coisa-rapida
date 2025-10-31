import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import * as crypto from 'crypto';

@Injectable()
export class TesteService {
  async getPreferencia(): Promise<any> {  // Alterado para async e retornar a preferência
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' });

    const preference = new Preference(client);

    try {
      const result = await preference.create({
        body: {
          items: [
            {
              title: 'Meu produto',
              quantity: 1,
              unit_price: 2000,
              id: '110'
            }
          ],
          payer: { 
            email: 'test_user_725044889950559613@testuser.com', 
          }
        }
      });
      return result;  // Retorna a preferência criada
    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      throw error;  // Lança erro para tratamento no controller
    }
  }

  async webHook(
    signature: string,
    requestId: string,
    dataId: string,
    body: any
  ): Promise<{ isValid: boolean; message: string; body?: any }> {
    // === VALIDAÇÃO DA ASSINATURA ===
    if (!signature || !requestId || !dataId) {
      return { isValid: false, message: 'Parâmetros faltando' };
    }

    // Extrai ts e v1 do x-signature
    const parts = signature.split(',').reduce((acc: Record<string, string>, part: string) => {
      const [key, value] = part.split('=');
      acc[key.trim()] = value.trim();
      return acc;
    }, {});

    const ts = parts.ts;
    const receivedHash = parts.v1;

    // Monta a string no formato: id:123;request-id:abc;ts:123456;
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

    // Gera o HMAC SHA256
    const SECRET_KEY = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'SUA_CHAVE_SECRETA_AQUI';
    console.log('secret:', SECRET_KEY);
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(manifest);
    const calculatedHash = hmac.digest('hex');
    console.log('calculatedHash:', calculatedHash);
    console.log('receivedHash:', receivedHash);

    // Verifica se é do Mercado Pago
    if (calculatedHash !== receivedHash) {
      console.log('Assinatura inválida!');
      return { isValid: false, message: 'Unauthorized' };
    }

    // === Assinatura válida! ===
    console.log('Webhook válido:', body);

    const { action, data, type } = body;

    if (type === 'payment') {
      console.log(`Pagamento ${action}: ID ${data.id}`);
      // Aqui você atualiza seu banco de dados
      // Exemplo: await this.updatePaymentStatus(data.id, action);
    }

    return { isValid: true, message: 'OK', body };
  }
}