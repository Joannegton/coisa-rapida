import { MercadoPagoService } from "src/modules/seguranca/infra/services/mercado-pago.service";
import { Resultado, ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from "src/shared/resultado";
import { Injectable } from "@nestjs/common";
import * as crypto from 'crypto';

type ProcessarWebhookProps = {
    signature: string;
    requestId: string;
    dataId: string;
    body: any;
}

@Injectable()
export class ProcessarWebhookUsecase {
    async execute(props: ProcessarWebhookProps): ResultadoAssincrono<void, ServicoExcecao> {
        if (!props.signature || !props.requestId || !props.dataId) {
            return ResultadoUtil.falha(new ServicoExcecao('Webhook inválido'));
        }

        // Processar webhook
        const processamento = this.processarWebhook(props);
        if (processamento.ehFalha()) {
            return ResultadoUtil.falha(processamento.erro!);
        }

        if (props.body.type === 'payment') {
            console.log(`Pagamento ${props.body.action}: ID ${props.body.data.id}`);
        // Aqui você atualiza seu banco de dados
        // Exemplo: await this.updatePaymentStatus(data.id, action);
        }

        return ResultadoUtil.sucesso();
    }

    private processarWebhook(props: ProcessarWebhookProps): Resultado<void, ServicoExcecao> {
        // Extrai ts e v1 do x-signature
        const parts = props.signature.split(',').reduce((acc: Record<string, string>, part: string) => {
            const [key, value] = part.split('=');
            acc[key.trim()] = value.trim();
            return acc;
        }, {});

        const ts = parts.ts;
        const receivedHash = parts.v1;

        // Monta a string no formato: id:123;request-id:abc;ts:123456;
        const manifest = `id:${props.dataId};request-id:${props.requestId};ts:${ts};`;

        // Gera o HMAC SHA256
        const SECRET_KEY = process.env.MERCADO_PAGO_WEBHOOK_SECRET || '';
        const hmac = crypto.createHmac('sha256', SECRET_KEY);
        hmac.update(manifest);
        const calculatedHash = hmac.digest('hex');
    
        // Verifica se é do Mercado Pago
        if (calculatedHash !== receivedHash) {
            return ResultadoUtil.falha(new ServicoExcecao('Não autorizado'));
        }

        return ResultadoUtil.sucesso()
    }
}