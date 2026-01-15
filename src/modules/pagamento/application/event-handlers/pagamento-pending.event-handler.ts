import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoPendingEvent } from '../../domain/events/pagamento-pending.event';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { DeadLetterQueueService } from 'src/shared/infra/services/dead-letter-queue.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class PagamentoPendingEventHandler {
    private readonly logger = new Logger(PagamentoPendingEventHandler.name);

    constructor(
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
    ) {}

    @OnEvent('pagamento.pending', { async: true })
    async handle(evento: PagamentoPendingEvent): Promise<void> {
        try {
            this.logger.log(`⏳ Pagamento ${evento.pagamentoId} está PENDENTE`);

            // TODO: Agendar verificação posterior (webhook pode não chegar)
            // await this.verificacaoPagamentoService.agendar({
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            //     verificarEm: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h depois
            // });

            // 📝 Auditoria complementar
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: evento.usuarioId,
                acao: AuditoriaAcao.PAGAMENTO_PENDING,
                recurso: 'pagamento',
                recursoId: evento.pagamentoId,
                descricao: `Pagamento em processamento. Aguardando confirmação. Aluguel: ${evento.aluguelId}`,
                nivel: 'medio',
                modulo: 'pagamento',
                estadoDepois: {
                    status: 'processando',
                    pagamentoId: evento.pagamentoId,
                    aluguelId: evento.aluguelId,
                },
            });

            this.logger.debug(
                `✅ Handler complementar: Pagamento ${evento.pagamentoId} pendente`,
            );
        } catch (error: any) {
            this.logger.warn(
                `⚠️ Erro em handler complementar de pagamento.pending: ${error.message}`,
            );
            // Não relança - evento já foi processado pela FILA
        }
    }
}
