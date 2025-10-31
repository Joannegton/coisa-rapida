import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from "src/shared/resultado";
import { CriarCheckoutDto } from "../dtos/Pagamento.dto";
import { MercadoPagoService } from "src/modules/seguranca/infra/services/mercado-pago.service";
import { Injectable } from "@nestjs/common";

type CriarPreferenciaPagamentoExceptions = ServicoExcecao | Error;

type PreferenciaPagamentoResponse = {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    aluguelId: string;
}

@Injectable()
export class CriarCheckoutUsecase {
    constructor(private readonly mercadoPagoIntegration: MercadoPagoService) {}

    async execute(props: CriarCheckoutDto): ResultadoAssincrono<PreferenciaPagamentoResponse, CriarPreferenciaPagamentoExceptions> {
        const preferencia = await this.mercadoPagoIntegration.criarPreferenciaPagamento(props);
        if (preferencia.ehFalha()) return ResultadoUtil.falha(preferencia.erro!);

        const preferenciaPagamentoDto = {
            id: preferencia.valor?.id,
            init_point: preferencia.valor?.init_point,
            sandbox_init_point: preferencia.valor?.sandbox_init_point,
            aluguelId: props.aluguelId,
        }

        return ResultadoUtil.sucesso(preferenciaPagamentoDto);
    }
}