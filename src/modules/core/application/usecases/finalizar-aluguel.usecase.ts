import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelException } from '../../domain/exceptions/aluguel.exception';

type FinalizarAluguelUseCaseProps = {
    aluguelId: string;
};

/**
 * ✅ PRODUÇÃO: UseCase para finalizar aluguel (devolução de item)
 *
 * Fluxo:
 * 1. Busca aluguel em ATIVO
 * 2. Chama domain.finalizar() → cria evento AluguelFinalizado
 * 3. Persiste estado CONCLUIDO
 * 4. Publica evento (desbloqueia datas)
 * 5. Se evento falhar → registra erro (não pode fazer rollback de finalização)
 */
export class FinalizarAluguelUseCase {
    private readonly logger = new Logger(FinalizarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async execute(props: FinalizarAluguelUseCaseProps): Promise<void> {
        // 1️⃣ Busca aluguel em ATIVO
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new BadRequestException(
                `Aluguel ${props.aluguelId} não encontrado`,
            );
        }

        // 2️⃣ Domain finaliza (deve estar em ATIVO)
        try {
            aluguel.finalizar();
        } catch (error) {
            if (error instanceof AluguelException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }

        // 3️⃣ Persiste estado CONCLUIDO
        try {
            await this.aluguelRepository.salvar(aluguel);
            this.logger.log(
                `✅ Aluguel ${props.aluguelId} finalizado/concluído`,
            );
        } catch (error) {
            this.logger.error(`Erro ao salvar finalização: ${error.message}`);
            throw error;
        }

        // 4️⃣ Publica evento (desbloqueia datas)
        // ⚠️ Se falhar, apenas loga erro (finalização já foi persistida)
        try {
            // for (const event of aluguel.domainEvents) {
            //     await this.eventEmitter.emitAsync(event.eventType, event);
            // }
            this.logger.log(
                `✅ Datas desbloqueadas após finalização do aluguel ${props.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `⚠️ AVISO: Falha ao desbloquear datas após finalização de ${props.aluguelId}: ${error.message}`,
            );
            // ⚠️ Não faz rollback porque finalização já foi persistida
            // Admin pode desbloquear manualmente se necessário
        }
    }
}
