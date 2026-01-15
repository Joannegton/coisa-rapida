import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelFinalizadoEvent } from '../../domain/events/aluguel-finalizado.event';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils } from 'src/shared/utils';

type FinalizarAluguelUseCaseProps = {
    aluguelId: string;
    usuarioId: string;
};

export class FinalizarAluguelUseCase {
    private readonly logger = new Logger(FinalizarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly eventBus: EventBus,
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: FinalizarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.finalizar(props.usuarioId);

        await this.aluguelRepository.salvar(aluguel);

        const evento = new AluguelFinalizadoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
        );

        try {
            await this.eventBus.publish(evento);
        } catch (error) {
            this.logger.warn(
                `⚠️ Falha ao publicar evento de finalização para aluguel ${props.aluguelId}: ${error.message}`,
            );
            // Não relança - aluguel já foi finalizado com sucesso
        }

        try {
            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: DataUtils.agoraDate(),
                usuarioId: props.usuarioId,
                acao: AuditoriaAcao.FINALIZAR_ALUGUEL,
                recurso: 'aluguel',
                recursoId: props.aluguelId,
                descricao: `Finalização/devolução de aluguel - Item devolvido`,
                nivel: 'alto',
                estadoAntes: {
                    status: aluguel.status,
                    finalizado: false,
                },
                estadoDepois: {
                    status: 'concluido',
                    finalizado: true,
                },
            });
        } catch (error) {
            this.logger.warn(
                `⚠️ Falha ao agendar auditoria para finalização de aluguel ${props.aluguelId} (aluguel já finalizado): ${error.message}`,
                error.stack,
            );
            // Não relança o erro - o aluguel foi finalizado com sucesso
        }
    }
}
