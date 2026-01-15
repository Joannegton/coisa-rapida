import {
    Resultado,
    ResultadoAssincrono,
    ResultadoUtil,
    ServicoExcecao,
} from 'src/shared/utils/resultado';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { v5 as uuidv5 } from 'uuid';
import { FirebaseConfigService } from 'src/config/firebase.config';
import { StatusAluguel } from '../../domain/Aluguel';
import { MercadoPagoService } from '../../infra/services/mercado-pago.service';
import { PagamentoRepository } from '../../infra/repositories/pagamento.repository';
import { PagamentoStatusEnum } from '../../infra/typeorm/pagamento.entity';

type ProcessarWebhookProps = {
    signature?: string;
    requestId?: string;
    dataId?: string;
    body: any;
    query?: any;
};

@Injectable()
export class ProcessarWebhookUsecase {
    private readonly logger = new Logger(ProcessarWebhookUsecase.name);

    constructor(
        private readonly mercadoPagoService: MercadoPagoService,
        private readonly pagamentoRepository: PagamentoRepository,
        private readonly firebaseConfig: FirebaseConfigService,
    ) {}

    async execute(
        props: ProcessarWebhookProps,
    ): ResultadoAssincrono<void, ServicoExcecao> {
        // Extrair tipo e tópico do webhook
        const type = props.body.type;

        if (props.signature && props.requestId && props.dataId) {
            const validacao = this.processarWebhook(props);
            if (validacao.ehFalha()) {
                this.logger.warn(
                    'Assinatura do webhook inválida - continuando processamento',
                );
            }
        }

        // Processar notificações de pagamento
        if (type === 'payment' && props.dataId) {
            try {
                const paymentResult =
                    await this.mercadoPagoService.obterStatusPagamento(
                        Number(props.dataId),
                    );

                if (paymentResult.ehFalha()) {
                    return ResultadoUtil.sucesso();
                }

                const payment = paymentResult.valor!;

                await this.atualizarPagamento(payment);
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

        return ResultadoUtil.sucesso();
    }

    /**
     * Atualiza o pagamento no banco de dados baseado nos dados do Mercado Pago
     */
    private async atualizarPagamento(payment: any): Promise<void> {
        try {
            const [id, tipo] = payment.external_reference
                .split(',')
                .map((s: string) => s.trim());
            // Converter external_reference (aluguelId) para UUID usando o mesmo namespace
            const NAMESPACE_ALUGUEL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
            const aluguelUuid = uuidv5(id, NAMESPACE_ALUGUEL);

            const pagamentos =
                await this.pagamentoRepository.buscarPorAluguelId(aluguelUuid);

            if (!pagamentos || pagamentos.length === 0) {
                this.logger.warn(
                    `Pagamento com aluguel_id ${aluguelUuid} (external_reference: ${payment.external_reference}) não encontrado no banco`,
                );
                return;
            }

            // Pegar o pagamento pendente mais recente (geralmente há apenas um)
            const pagamento = pagamentos[0];

            let novoStatus: PagamentoStatusEnum;

            switch (payment.status) {
                case 'approved':
                    novoStatus = PagamentoStatusEnum.APROVADO;
                    break;
                case 'rejected':
                case 'cancelled':
                    novoStatus = PagamentoStatusEnum.RECUSADO;
                    break;
                case 'refunded':
                    novoStatus = PagamentoStatusEnum.REEMBOLSADO;
                    break;
                case 'in_process':
                case 'in_mediation':
                    novoStatus = PagamentoStatusEnum.PROCESSANDO;
                    break;
                default:
                    novoStatus = PagamentoStatusEnum.PENDENTE;
            }

            await this.pagamentoRepository.atualizar(pagamento.id, {
                status: novoStatus,
                gateway_response: payment,
                data_pagamento:
                    payment.status === 'approved' ? new Date() : undefined,
            });

            if (payment.status === 'approved') {
                await this.atualizarAluguelOuVendaNoFirestore(id, tipo);
            }
        } catch (error) {
            this.logger.error(
                `Erro ao atualizar pagamento: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    private async atualizarAluguelOuVendaNoFirestore(
        transacaoId: string,
        tipo: 'venda' | 'aluguel' | 'caucao',
    ): Promise<void> {
        try {
            const db = this.firebaseConfig.getFirestore();

            const collectionName =
                tipo === 'aluguel' || tipo === 'caucao' ? 'alugueis' : 'vendas';
            const docRef = db.collection(collectionName).doc(transacaoId);

            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                this.logger.warn(
                    `Documento ${tipo} com ID ${transacaoId} não encontrado no Firestore na coleção ${collectionName}`,
                );
                return;
            }

            const updateData: any = {
                atualizadoEm: new Date(),
            };

            if (tipo === 'caucao') {
                updateData.status = 'solicitado';
                updateData['caucao.status'] = 'bloqueada';
                updateData['caucao.metodoPagamento'] = 'mercado_pago';
                updateData['caucao.dataBloqueio'] = new Date();
            } else if (tipo === 'aluguel') {
                updateData.status = 'solicitado';
            } else if (tipo === 'venda') {
                updateData.statusPagamento = 'pago';
                updateData.transacaoId = transacaoId;
                updateData.dataPagamento = new Date();
                updateData.metodoPagamento = 'mercado_pago';
            }

            await docRef.update(updateData);
        } catch (error) {
            this.logger.error(
                `❌ Erro ao atualizar ${tipo} ${transacaoId} no Firestore: ${error.message}`,
                error.stack,
            );
        }
    }

    private processarWebhook(
        props: ProcessarWebhookProps,
    ): Resultado<void, ServicoExcecao> {
        if (!props.signature || !props.requestId || !props.dataId) {
            return ResultadoUtil.falha(
                new ServicoExcecao('Dados insuficientes para validação'),
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
            return ResultadoUtil.falha(new ServicoExcecao('Não autorizado'));
        }

        return ResultadoUtil.sucesso();
    }
}
