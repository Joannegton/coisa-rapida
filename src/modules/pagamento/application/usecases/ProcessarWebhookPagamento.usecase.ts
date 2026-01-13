import {
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { PagamentoException } from '../../domain/exceptions/pagamento.exception';
import * as crypto from 'node:crypto';
import type { MercadoPagoService } from '../../domain/services/mercado-pago.service';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';

type ProcessarWebhookProps = {
    signature?: string;
    requestId?: string;
    dataId?: string;
    body: any;
    query?: any;
};

@Injectable()
export class ProcessarWebhookPagamentoUsecase {
    private readonly logger = new Logger(ProcessarWebhookPagamentoUsecase.name);

    constructor(
        @Inject('MercadoPagoService')
        private readonly mercadoPagoService: MercadoPagoService,
        @Inject('PagamentoRepository')
        private readonly pagamentoRepository: PagamentoRepository,
    ) {}

    async execute(props: ProcessarWebhookProps): Promise<void> {
        try {
            const type = props.body.type;

            if (props.signature && props.requestId && props.dataId) {
                this.processarWebhook(props);
            }

            // Processar notificações de pagamento
            if (type === 'payment' && props.dataId) {
                try {
                    const paymentResult =
                        await this.mercadoPagoService.obterStatusPagamento(
                            props.dataId,
                        );

                    const [aluguelId, tipo] = paymentResult.external_reference
                        .split(',')
                        .map((s: string) => s.trim());

                    const pagamento =
                        await this.pagamentoRepository.buscarUltimoPorAluguelId(
                            aluguelId,
                        );

                    if (!pagamento)
                        throw new NotFoundException(
                            'Pagamento não encontrado para o aluguel.',
                        );

                    pagamento.aprovar(paymentResult.id.toString());

                    await this.pagamentoRepository.salvar(pagamento);
                } catch (error) {
                    this.logger.error(
                        `Erro ao processar webhook de pagamento: ${error.message}`,
                    );
                }
            } else if (type === 'merchant_order') {
                this.logger.log(
                    `Webhook de merchant_order recebido - ignorando (ID: ${props.dataId})`,
                );
            } else {
                this.logger.warn(
                    `Tipo de webhook desconhecido ou sem dataId: ${type}`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Erro ao processar webhook: ${error.message}`,
                error.stack,
            );
            throw new PagamentoException(
                `Erro ao processar webhook de pagamento`,
            );
        }
    }

    private processarWebhook(props: ProcessarWebhookProps): void {
        if (!props.signature || !props.requestId || !props.dataId) {
            throw new InvalidPropsException(
                'Dados insuficientes para validação',
            );
        }

        // Extrai ts e v1 do x-signature
        const parts = props.signature
            .split(',')
            .reduce((acc: Record<string, string>, part: string) => {
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
            throw new UnauthorizedException('Não autorizado');
        }
    }
}
