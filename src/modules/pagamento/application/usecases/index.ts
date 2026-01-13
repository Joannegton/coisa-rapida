import { CriarPreferenciaPagamentoUsecase } from './CriarPreferenciaPagamento.usecase';
import { ProcessarWebhookPagamentoUsecase } from './ProcessarWebhookPagamento.usecase';

export const PagamentoUsecases = [
    CriarPreferenciaPagamentoUsecase,
    ProcessarWebhookPagamentoUsecase,
];
