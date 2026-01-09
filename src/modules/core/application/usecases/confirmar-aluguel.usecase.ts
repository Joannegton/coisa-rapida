import {
    BadRequestException,
    Inject,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import { EventBus } from '@nestjs/cqrs';

type ConfirmarAluguelUseCaseProps = {
    aluguelId: string;
    usuarioId: string;
};

export class ConfirmarAluguelUseCase {
    private readonly logger = new Logger(ConfirmarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(props: ConfirmarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.confirmar(props.usuarioId);

        await this.aluguelRepository.salvar(aluguel);

        // Se falhar aqui, rollback abaixo garante consistência
        try {
            this.eventBus.publish(
                new AluguelConfirmadoEvent(
                    props.aluguelId,
                    aluguel.itemId,
                    aluguel.dataInicio,
                    aluguel.dataFim,
                    aluguel.locador.id,
                    aluguel.locatario.id,
                ),
            );
            this.logger.log(
                `✅ Eventos publicados para aluguel ${props.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ CRÍTICO: Falha ao publicar evento de confirmação: ${error.message}`,
            );

            // Rollback: Volta para SOLICITADO
            try {
                aluguel.voltarParaSolicitado();
                await this.aluguelRepository.salvar(aluguel);
                this.logger.warn(
                    `⚠️ Aluguel ${props.aluguelId} voltou para SOLICITADO (rollback)`,
                );
            } catch (rollbackError) {
                this.logger.error(
                    `\u274c ERRO DE ROLLBACK: Não conseguiu voltar para SOLICITADO: ${rollbackError.message}`,
                );
                throw new Error(
                    `Erro crítico de consistência. Contate administrador. Erro: ${error.message}`,
                );
            }

            throw new BadRequestException(
                `Falha ao confirmar aluguel. Tente novamente.`,
            );
        }
    }
}
