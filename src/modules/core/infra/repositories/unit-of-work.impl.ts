import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
    UnitOfWork,
    ContextoTransacional,
} from '../../domain/repositories/unit-of-work';
import { Aluguel } from '../../domain/aluguel';
import { OutboxEvent } from '../../domain/outbox-event';
import { AluguelMapper } from '../mappers/aluguel.mapper';
import { OutboxEventMapper } from '../mappers/outbox-event.mapper';
import { OutboxEventModel } from '../models/outbox-event.model';

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
    private readonly logger = new Logger(TypeOrmUnitOfWork.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly aluguelMapper: AluguelMapper,
    ) {}

    async executarEmTransacao<T>(
        trabalho: (contexto: ContextoTransacional) => Promise<T>,
    ): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Cria contexto transacional
            const contexto: ContextoTransacional = {
                salvarAluguel: async (aluguel: Aluguel) => {
                    const modeloAluguel = this.aluguelMapper.toModel(aluguel);
                    await queryRunner.manager.save(modeloAluguel);
                },

                salvarEvento: async (evento: OutboxEvent) => {
                    const modeloEvento = OutboxEventMapper.toModel(evento);
                    await queryRunner.manager.save(
                        OutboxEventModel,
                        modeloEvento,
                    );
                },
            };

            // Executa trabalho dentro da transação
            const resultado = await trabalho(contexto);

            // Commit se tudo der certo
            await queryRunner.commitTransaction();

            return resultado;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `Transação falhou: ${error.message}`,
                error.stack,
            );
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
