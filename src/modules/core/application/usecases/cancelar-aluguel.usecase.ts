import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelCanceladoEvent } from '../../domain/events/aluguel-cancelado.event';
import { CancelarAluguelDto } from '../dtos/cancelar-aluguel.dto';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils } from 'src/shared/utils';

type CancelarAluguelUseCaseProps = CancelarAluguelDto & {
    aluguelId: string;
    usuarioId: string;
};

export class CancelarAluguelUseCase {
    private readonly logger = new Logger(CancelarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly auditoriaFilaService: AuditoriaFilaService,
        private readonly eventBus: EventBus,
    ) {}

    async execute(props: CancelarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.cancelar(props.usuarioId, props.motivo);

        await this.aluguelRepository.salvar(aluguel);

        const evento = new AluguelCanceladoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
            props.motivo || 'Cancelado pelo usuário',
        );

        try {
            await this.eventBus.publish(evento);
            this.logger.log(
                `📢 Evento publicado: AluguelCanceladoEvent para aluguel ${props.aluguelId}`,
            );
        } catch (eventError: any) {
            this.logger.warn(
                `⚠️ Falha ao publicar evento de cancelamento para aluguel ${props.aluguelId}: ${eventError.message}`,
            );
            // Não relança - aluguel já foi cancelado com sucesso
        }

        try {
            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: DataUtils.agoraDate(),
                usuarioId: props.usuarioId,
                acao: AuditoriaAcao.CANCELAR_ALUGUEL,
                recurso: 'aluguel',
                recursoId: props.aluguelId,
                descricao: `Cancelamento de aluguel - Motivo: ${props.motivo || 'Não informado'}`,
                nivel: 'medio',
                modulo: 'core',
                estadoAntes: {
                    status: aluguel.status,
                },
                estadoDepois: {
                    status: 'CANCELADO',
                    motivo: props.motivo,
                },
            });
        } catch (auditError: any) {
            this.logger.warn(
                `⚠️ Auditoria falhou para cancelamento de aluguel ${props.aluguelId}: ${auditError.message}`,
            );
        }
    }
}
