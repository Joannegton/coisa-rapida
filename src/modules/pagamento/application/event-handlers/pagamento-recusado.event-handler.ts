import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoRecusadoEvent } from '../../domain/events/pagamento-recusado.event';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class PagamentoRecusadoEventHandler {
    private readonly logger = new Logger(PagamentoRecusadoEventHandler.name);

    constructor(
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
    ) {}

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

            // 📝 Auditoria complementar
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: evento.usuarioId,
                acao: AuditoriaAcao.PAGAMENTO_RECUSADO,
                recurso: 'pagamento',
                recursoId: evento.pagamentoId,
                descricao: `Pagamento recusado. Motivo: ${evento.motivo || 'Não informado'}. Aluguel: ${evento.aluguelId}`,
                nivel: 'alto',
                modulo: 'pagamento',
                estadoDepois: {
                    status: 'recusado',
                    motivo: evento.motivo,
                    pagamentoId: evento.pagamentoId,
                    aluguelId: evento.aluguelId,
                },
            });

            this.logger.debug(
                `✅ Handler complementar: Pagamento ${evento.pagamentoId} recusado`,
            );
        } catch (error: any) {
            this.logger.warn(
                `⚠️ Erro em handler complementar de pagamento.recusado: ${error.message}`,
            );
            // Não relança - evento já foi processado pela FILA
        }
    }
}
