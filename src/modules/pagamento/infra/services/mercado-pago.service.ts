import MercadoPagoConfig, { Preference } from 'mercadopago';
import {
    MercadoPagoService,
    PagamentoStatusResponse,
    PreferenciaPagamentoProps,
    WebhookProcessado,
} from '../../domain/services/mercado-pago.service';
import {
    PreferenceRequest,
    PreferenceResponse,
} from 'mercadopago/dist/clients/preference/commonTypes';
import { Logger } from '@nestjs/common';
import { ServiceException } from 'src/common/exceptions/service.exception';
import axios from 'axios';

export class MercadoPagoServiceImpl implements MercadoPagoService {
    private readonly apiUrl = 'https://api.mercadopago.com';
    private readonly client = new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN as string,
    });
    private readonly preference = new Preference(this.client);

    private readonly logger = new Logger(MercadoPagoServiceImpl.name);

    async criarPreferenciaPagamento(
        props: PreferenciaPagamentoProps,
    ): Promise<PreferenceResponse> {
        console.log('props', props.backUrls);
        try {
            const body: PreferenceRequest = {
                items: [
                    {
                        id: props.aluguelId,
                        title: props.itemNome,
                        description: props.itemDescricao,
                        quantity: 1,
                        unit_price: Number.parseFloat(props.valor.toString()),
                        currency_id: 'BRL',
                    },
                ],
                payer: {
                    email: props.locatarioEmail,
                    name: props.locatarioNome,
                },
                external_reference: props.externalReference,
                back_urls: props.backUrls || {
                    success: `coisarapida://success`,
                    failure: `coisarapida://failure`,
                    pending: `coisarapida://pending`,
                },
                auto_return: 'approved',
                statement_descriptor: 'COISARAPIDA',
                notification_url: `${process.env.API_URL as string}/pagamento/webhook`,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                ).toISOString(), // 7 dias
            };

            const result = await this.preference.create({
                body,
            });

            return result;
        } catch (error) {
            this.logger.error(
                `Erro ao criar preferência de pagamento: ${error.response?.data?.message || error.message}`,
            );
            throw new ServiceException(
                'Erro ao criar preferência de pagamento.',
            );
        }
    }

    async obterStatusPagamento(
        paymentId: string,
    ): Promise<PagamentoStatusResponse> {
        try {
            const response = await axios.get<PagamentoStatusResponse>(
                `${this.apiUrl}/v1/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN || ''}`,
                    },
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error(
                `Erro ao obter status do pagamento ${paymentId}: ${error.response?.data?.message || error.message}`,
            );
            throw new ServiceException('Erro ao obter status do pagamento');
        }
    }

    processarWebhook(webhookData: any): WebhookProcessado | null {
        const { type, data, action } = webhookData;

        if (type === 'payment' && data?.id) {
            return {
                tipo: 'pagamento',
                PagamentoId: data.id,
                acao: action,
            };
        } else if (type === 'merchant_order' && data?.id) {
            return {
                tipo: 'pedido',
                pedidoId: data.id,
                acao: action,
            };
        }

        return null;
    }
}
