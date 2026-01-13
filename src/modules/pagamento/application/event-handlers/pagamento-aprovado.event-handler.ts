import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    PagamentoAprovadoEvent,
    TipoServico,
} from '../../domain/events/pagamento-aprovado.event';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Injectable()
export class PagamentoAprovadoEventHandler {
    private readonly logger = new Logger(PagamentoAprovadoEventHandler.name);

    constructor(
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
    ) {}

    @OnEvent('pagamento.aprovado', { async: true })
    async handle(evento: PagamentoAprovadoEvent): Promise<void> {
        try {
            // 📝 Auditoria adicional para compliance
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: evento.usuarioId,
                acao: AuditoriaAcao.PAGAMENTO_APROVADO,
                recurso: 'pagamento',
                recursoId: evento.pagamentoId,
                descricao: `Pagamento aprovado - Tipo: ${evento.tipoServico}. Aluguel: ${evento.aggregateId}`,
                nivel: 'alto',
                modulo: 'pagamento',
                estadoDepois: {
                    status: 'aprovado',
                    pagamentoId: evento.pagamentoId,
                    aluguelId: evento.aggregateId,
                },
            });

            // TODO: Invalidar cache do aluguel se houver
            // await this.cacheService.invalidar(`aluguel:${evento.aggregateId}`);

            // TODO: Enviar notificação ao usuário (NÃO-CRÍTICA)
            // await this.notificationService.notificar({
            //     usuarioId: evento.usuarioId,
            //     titulo: 'Pagamento Aprovado',
            //     mensagem: `Seu pagamento foi aprovado`,
            // });

            this.logger.debug(
                `✅ Handler complementar: Pagamento ${evento.pagamentoId} aprovado`,
            );
        } catch (error: any) {
            // ⚠️ Erro aqui não importa - é apenas complementar
            this.logger.warn(
                `⚠️ Erro em handler complementar de pagamento.aprovado: ${error.message}`,
            );
            // Não relança - evento já foi processado pela FILA
        }
    }
}
