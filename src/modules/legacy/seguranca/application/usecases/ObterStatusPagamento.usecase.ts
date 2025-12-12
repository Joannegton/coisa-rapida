import {
    ResultadoAssincrono,
    ResultadoUtil,
    ServicoExcecao,
} from 'src/shared/utils/resultado';
import { Injectable } from '@nestjs/common';
import { MercadoPagoService } from '../../infra/services/mercado-pago.service';

type PagamentoStatusResponse = {
    id: number;
    status: string;
    status_detail: string;
    transaction_amount: number;
    external_reference: string;
    payer: {
        email: string;
        identification?: {
            type: string;
            number: string;
        };
    };
};

@Injectable()
export class ObterStatusPagamentoUsecase {
    constructor(private readonly mercadoPagoIntegration: MercadoPagoService) {}

    async execute(
        paymentId: number,
    ): ResultadoAssincrono<PagamentoStatusResponse, ServicoExcecao> {
        const status =
            await this.mercadoPagoIntegration.obterStatusPagamento(paymentId);
        if (status.ehFalha()) return ResultadoUtil.falha(status.erro!);

        return ResultadoUtil.sucesso(status.valor);
    }
}
