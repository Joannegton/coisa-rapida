import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoAprovadoEvent } from '../../domain/events/pagamento-aprovado.event';

/**
 * Responsabilidades:
 */
@Injectable()
export class PagamentoAprovadoEventHandler {
    private readonly logger = new Logger(PagamentoAprovadoEventHandler.name);

    @OnEvent('pagamento.aprovado', { async: true })
    async handle(evento: PagamentoAprovadoEvent): Promise<void> {
        try {
            this.logger.log(
                `🎉 Pagamento ${evento.pagamentoId} aprovado! Aluguel: ${evento.aluguelId}`,
            );

            // 1️⃣ TODO: Notificar usuário por email
            // await this.emailService.enviarPagamentoAprovado({
            //     usuarioId: evento.usuarioId,
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            // });

            // 2️⃣ TODO: Iniciar processo de transferência para locador
            // await this.transferenciaPagamentoService.iniciar({
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            // });

            // 3️⃣ TODO: Registrar auditoria
            // await this.auditoriaService.registrar({
            //     acao: 'PAGAMENTO_APROVADO',
            //     recursoId: evento.pagamentoId,
            //     usuarioId: evento.usuarioId,
            // });

            this.logger.debug(
                `Handler pagamento.aprovado completado para ${evento.pagamentoId}`,
            );
        } catch (error: any) {
            // ❌ Erro não bloqueia saga (log e continua)
            this.logger.error(
                `Erro ao processar pagamento.aprovado: ${error.message}`,
                error.stack,
            );
            // NÃO relança - permite que outros handlers executem
            // A falha é registrada em auditoria para retry manual se necessário
        }
    }
}
