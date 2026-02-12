import { PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes';

export type PreferenciaPagamentoProps = {
    aluguelId: string;
    valor: number;
    itemNome: string;
    itemDescricao?: string;
    locatarioEmail: string;
    locatarioNome?: string;
    externalReference: string;
    tipo: 'aluguel' | 'venda' | 'caucao' | 'multa';
    backUrls?: {
        success?: string;
        failure?: string;
        pending?: string;
    };
};

export type PagamentoStatusResponse = {
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
};

export type WebhookProcessado = {
    tipo: string;
    PagamentoId?: string;
    pedidoId?: string;
    acao: string;
};

export interface MercadoPagoService {
    criarPreferenciaPagamento(
        props: PreferenciaPagamentoProps,
    ): Promise<PreferenceResponse>;
    obterStatusPagamento(pagamentoId: string): Promise<PagamentoStatusResponse>;
    processarWebhook(data: any);
}
