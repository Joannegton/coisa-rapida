import { MercadoPagoService } from "src/modules/seguranca/infra/services/mercado-pago.service";
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from "src/shared/resultado";
import { Injectable } from "@nestjs/common";

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

    async execute(paymentId: number): ResultadoAssincrono<PagamentoStatusResponse, ServicoExcecao> {
        const status = await this.mercadoPagoIntegration.obterStatusPagamento(paymentId);
        if (status.ehFalha()) return ResultadoUtil.falha(status.erro!);

        return ResultadoUtil.sucesso(status.valor);
    }
}