import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoRecusadoEvent } from '../../domain/events/pagamento-recusado.event';

@Injectable()
export class PagamentoRecusadoEventHandler {
    private readonly logger = new Logger(PagamentoRecusadoEventHandler.name);

    @OnEvent('pagamento.recusado', { async: true })
    async handle(evento: PagamentoRecusadoEvent): Promise<void> {
        try {
            this.logger.warn(
                `❌ Pagamento ${evento.pagamentoId} foi RECUSADO! Motivo: ${evento.motivo}`,
            );

            // 1️⃣ TODO: Notificar usuário sobre rejeição
            // await this.emailService.enviarPagamentoRecusado({
            //     usuarioId: evento.usuarioId,
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            //     motivo: evento.motivo,
            // });

            // 2️⃣ TODO: Atualizar status do aluguel para "pagamento_recusado"
            // await this.aluguelService.atualizarStatusPagamento({
            //     aluguelId: evento.aluguelId,
            //     status: 'pagamento_recusado',
            //     motivo: evento.motivo,
            // });

            // 3️⃣ TODO: Registrar tentativa de pagamento falha
            // await this.tentativaPagamentoService.registrar({
            //     aluguelId: evento.aluguelId,
            //     pagamentoId: evento.pagamentoId,
            //     motivo: evento.motivo,
            // });

            // 4️⃣ TODO: Se exceder tentativas, cancelar aluguel
            // const tentativas = await this.tentativaPagamentoService.contar(evento.aluguelId);
            // if (tentativas >= 3) {
            //     await this.aluguelService.cancelar(evento.aluguelId, 'Máximo de tentativas de pagamento excedido');
            // }

            this.logger.debug(
                `Handler pagamento.recusado completado para ${evento.pagamentoId}`,
            );
        } catch (error: any) {
            this.logger.error(
                `Erro ao processar pagamento.recusado: ${error.message}`,
                error.stack,
            );
        }
    }
}
