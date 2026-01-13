import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoPendingEvent } from '../../domain/events/pagamento-pending.event';

@Injectable()
export class PagamentoPendingEventHandler {
    private readonly logger = new Logger(PagamentoPendingEventHandler.name);

    @OnEvent('pagamento.pending', { async: true })
    async handle(evento: PagamentoPendingEvent): Promise<void> {
        try {
            this.logger.log(
                `⏳ Pagamento ${evento.pagamentoId} está PENDENTE (aguardando processamento)`,
            );

            // 1️⃣ TODO: Notificar usuário que pagamento está sendo processado
            // await this.emailService.enviarPagamentoPendente({
            //     usuarioId: evento.usuarioId,
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            // });

            // 2️⃣ TODO: Atualizar status do aluguel para "pagamento_pendente"
            // await this.aluguelService.atualizarStatusPagamento({
            //     aluguelId: evento.aluguelId,
            //     status: 'pagamento_pendente',
            // });

            // 3️⃣ TODO: Agendar verificação posterior (webhook pode não chegar)
            // await this.verificacaoPagamentoService.agendar({
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            //     verificarEm: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h depois
            // });

            this.logger.debug(
                `Handler pagamento.pending completado para ${evento.pagamentoId}`,
            );
        } catch (error: any) {
            this.logger.error(
                `Erro ao processar pagamento.pending: ${error.message}`,
                error.stack,
            );
        }
    }
}
