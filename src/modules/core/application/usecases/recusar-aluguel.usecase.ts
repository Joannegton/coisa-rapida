import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelRecusadoEvent } from '../../domain/events/aluguel-recusado.event';
import { RecusarAluguelDto } from '../dtos/recusar-aluguel.dto';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils } from 'src/shared/utils';
import { Request } from 'express';

type RecusarAluguelUseCaseProps = RecusarAluguelDto & {
    aluguelId: string;
    usuarioId: string;
    request: Request;
};

export class RecusarAluguelUseCase {
    private readonly logger = new Logger(RecusarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly eventBus: EventBus,
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: RecusarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.recusar(props.motivo, props.usuarioId);

        await this.aluguelRepository.salvar(aluguel);

        const evento = new AluguelRecusadoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
            props.motivo,
        );

        try {
            await this.eventBus.publish(evento);
            this.logger.log(
                `📢 Evento publicado: AluguelRecusadoEvent para aluguel ${props.aluguelId}`,
            );
        } catch (eventError: any) {
            this.logger.warn(
                `⚠️ Falha ao publicar evento de recusa para aluguel ${props.aluguelId}: ${eventError.message}`,
            );
            // Não relança - aluguel já foi recusado com sucesso
        }

        // Auditoria (não-crítica)
        try {
            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: DataUtils.agoraDate(),
                usuarioId: props.usuarioId,
                acao: AuditoriaAcao.RECUSAR_ALUGUEL,
                recurso: 'aluguel',
                recursoId: props.aluguelId,
                descricao: `Recusa de solicitação de aluguel - Motivo: ${props.motivo}`,
                nivel: 'medio',
                modulo: 'core',
                estadoAntes: {
                    status: aluguel.status,
                },
                estadoDepois: {
                    status: 'RECUSADO',
                    motivo: props.motivo,
                },
            });
        } catch (auditError: any) {
            this.logger.warn(
                `⚠️ Auditoria falhou para recusa de aluguel ${props.aluguelId}: ${auditError.message}`,
            );
        }
    }
}
