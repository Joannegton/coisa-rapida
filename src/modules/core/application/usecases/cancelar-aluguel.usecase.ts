import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelException } from '../../domain/exceptions/aluguel.exception';

type CancelarAluguelUseCaseProps = {
    aluguelId: string;
    motivo: string;
};

/**
 * ✅ PRODUÇÃO: UseCase para cancelar aluguel
 *
 * Fluxo:
 * 1. Busca aluguel
 * 2. Chama domain.cancelar(motivo) → cria evento AluguelCancelado se estava CONFIRMADO/ATIVO
 * 3. Persiste estado CANCELADO
 * 4. Publica evento (desbloqueia datas se estava bloqueado)
 * 5. Se evento falhar → registra erro (não pode fazer rollback de cancelamento)
 */
export class CancelarAluguelUseCase {
    private readonly logger = new Logger(CancelarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async execute(props: CancelarAluguelUseCaseProps): Promise<void> {
        // 1️⃣ Busca aluguel
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new BadRequestException(`Aluguel ${props.aluguelId} não encontrado`);
        }

        // 2️⃣ Domain cria evento (se estava bloqueado)
        try {
            aluguel.cancelar(props.motivo);
        } catch (error) {
            if (error instanceof AluguelException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }

        // 3️⃣ Persiste estado CANCELADO
        try {
            await this.aluguelRepository.salvar(aluguel);
            this.logger.log(
                `✅ Aluguel ${props.aluguelId} cancelado. Motivo: ${props.motivo}`,
            );
        } catch (error) {
            this.logger.error(`Erro ao salvar cancelamento: ${error.message}`);
            throw error;
        }

        // 4️⃣ Publica evento se gerou (desbloqueia datas)
        // ⚠️ Se falhar, apenas loga erro (cancelamento já foi persistido)
        try {
            for (const event of aluguel.domainEvents) {
                await this.eventEmitter.emitAsync(event.eventType, event);
            }
            this.logger.log(`✅ Datas desbloqueadas para aluguel ${props.aluguelId}`);
        } catch (error) {
            this.logger.error(
                `⚠️ AVISO: Falha ao desbloquear datas para aluguel ${props.aluguelId}: ${error.message}`,
            );
            // ⚠️ Não faz rollback porque cancelamento já foi persistido
            // Admin pode desbloquear manualmente se necessário
        }

        aluguel.clearEvents();
    }
}
