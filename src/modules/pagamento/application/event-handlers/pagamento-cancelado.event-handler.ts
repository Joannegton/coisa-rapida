import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PagamentoCanceladoEvent } from '../../domain/events/pagamento-cancelado.event';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class PagamentoCanceladoEventHandler {
    private readonly logger = new Logger(PagamentoCanceladoEventHandler.name);

    constructor(
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
    ) {}

    @OnEvent('pagamento.cancelado', { async: true })
    async handle(evento: PagamentoCanceladoEvent): Promise<void> {
        try {
            this.logger.warn(
                `🚫 Pagamento ${evento.pagamentoId} foi CANCELADO! Motivo: ${evento.motivo}`,
            );

            // TODO: Notificar usuário sobre cancelamento (NÃO-CRÍTICO)
            // await this.emailService.enviarPagamentoCancelado({
            //     usuarioId: evento.usuarioId,
            //     pagamentoId: evento.pagamentoId,
            //     aluguelId: evento.aluguelId,
            //     motivo: evento.motivo,
            // });

            // 📝 Auditoria complementar
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: evento.usuarioId,
                acao: AuditoriaAcao.PAGAMENTO_CANCELADO,
                recurso: 'pagamento',
                recursoId: evento.pagamentoId,
                descricao: `Pagamento cancelado. Motivo: ${evento.motivo || 'Não informado'}. Aluguel: ${evento.aluguelId}`,
                nivel: 'alto',
                modulo: 'pagamento',
                estadoDepois: {
                    status: 'cancelado',
                    motivo: evento.motivo,
                    pagamentoId: evento.pagamentoId,
                    aluguelId: evento.aluguelId,
                },
            });

            this.logger.debug(
                `✅ Handler complementar: Pagamento ${evento.pagamentoId} cancelado`,
            );
        } catch (error: any) {
            this.logger.warn(
                `⚠️ Erro em handler complementar de pagamento.cancelado: ${error.message}`,
            );
            // Não relança - evento já foi processado pela FILA
        }
    }
}
