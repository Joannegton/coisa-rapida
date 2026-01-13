import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoCanceladoEvent } from '../../domain/events/pagamento-cancelado.event';

@Injectable()
export class PagamentoCanceladoEventHandler {
    private readonly logger = new Logger(PagamentoCanceladoEventHandler.name);

    @OnEvent('pagamento.cancelado', { async: true })
    async handle(evento: PagamentoCanceladoEvent): Promise<void> {
        try {
            this.logger.warn(
                `🚫 Pagamento ${evento.pagamentoId} foi CANCELADO! Motivo: ${evento.motivo}`,
            );

            // 1️⃣ TODO: Notificar usuário sobre cancelamento
            // await this.emailService.enviarPagamentoCancelado({
            //     usuarioId: evento.usuarioId,
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            //     motivo: evento.motivo,
            // });

            // 2️⃣ TODO: Cancelar aluguel
            // await this.aluguelService.cancelar(evento.aluguelId, `Pagamento cancelado: ${evento.motivo}`);

            // 3️⃣ TODO: Processar reembolso se necessário
            // const pagamento = await this.pagamentoRepository.buscarPorId(evento.pagamentoId);
            // if (pagamento.foiProcessado) {
            //     await this.reembolsoService.processar({
            //         pagamentoId: evento.pagamentoId,
            //         aluguelId: evento.aluguelId,
            //         motivo: `Cancelamento: ${evento.motivo}`,
            //     });
            // }

            // 4️⃣ TODO: Registrar auditoria
            // await this.auditoriaService.registrar({
            //     acao: 'PAGAMENTO_CANCELADO',
            //     recursoId: evento.pagamentoId,
            //     usuarioId: evento.usuarioId,
            //     detalhes: { motivo: evento.motivo },
            // });

            this.logger.debug(
                `Handler pagamento.cancelado completado para ${evento.pagamentoId}`,
            );
        } catch (error: any) {
            this.logger.error(
                `Erro ao processar pagamento.cancelado: ${error.message}`,
                error.stack,
            );
        }
    }
}
