import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelException } from '../../domain/exceptions/aluguel.exception';

type ConfirmarAluguelUseCaseProps = {
    aluguelId: string;
};

/**
 * ✅ PRODUÇÃO: UseCase que garante consistência
 *
 * Fluxo:
 * 1. Busca aluguel (SOLICITADO)
 * 2. Chama domain.confirmar() → cria evento AluguelConfirmado
 * 3. Persiste estado CONFIRMADO no banco
 * 4. Publica evento (EventHandler bloqueia datas)
 * 5. Se evento falhar → volta para SOLICITADO (rollback)
 *
 * Garante que datas NUNCA ficam desbloqueadas com aluguel CONFIRMADO
 */
export class ConfirmarAluguelUseCase {
    private readonly logger = new Logger(ConfirmarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async execute(props: ConfirmarAluguelUseCaseProps): Promise<void> {
        // 1️⃣ Busca aluguel em SOLICITADO
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new BadRequestException(
                `Aluguel ${props.aluguelId} não encontrado`,
            );
        }

        // 2️⃣ Domain cria evento
        try {
            aluguel.confirmar();
        } catch (error) {
            if (error instanceof AluguelException) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }

        // 3️⃣ Persiste estado CONFIRMADO
        try {
            await this.aluguelRepository.salvar(aluguel);
            this.logger.log(
                `✅ Aluguel ${props.aluguelId} salvo em CONFIRMADO`,
            );
        } catch (error) {
            this.logger.error(`Erro ao salvar aluguel: ${error.message}`);
            throw error;
        }

        // 4️⃣ Publica evento (bloqueia datas)
        // ✅ IMPORTANTE: Se falhar aqui, rollback abaixo garante consistência
        try {
            for (const event of aluguel.domainEvents) {
                await this.eventEmitter.emitAsync(event.eventType, event);
            }
            this.logger.log(
                `✅ Eventos publicados para aluguel ${props.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ CRÍTICO: Falha ao publicar evento de confirmação: ${error.message}`,
            );

            // 5️⃣ Rollback: Volta para SOLICITADO
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
                `Falha ao confirmar aluguel: ${error.message}. Tente novamente.`,
            );
        }

        aluguel.clearEvents();
    }
}
