import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
    PagamentoUnitOfWork,
    PagamentoContextoTransacional,
} from '../../domain/repositories/pagamento-unit-of-work';
import { Pagamento } from '../../domain/pagamento';
import { Transferencia } from '../../domain/transferencia';
import { OutboxEvent } from 'src/modules/core/domain/outbox-event';
import { PagamentoMapper } from '../mappers/pagamento.mapper';
import { TransferenciaMapper } from '../mappers/transferencia.mapper';
import { OutboxEventMapper } from 'src/modules/core/infra/mappers/outbox-event.mapper';
import { OutboxEventModel } from 'src/modules/core/infra/models/outbox-event.model';
import { RepositoryException } from 'src/common/exceptions/repository.exception';

@Injectable()
export class PagamentoUnitOfWorkImpl implements PagamentoUnitOfWork {
    private readonly logger = new Logger(PagamentoUnitOfWorkImpl.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly pagamentoMapper: PagamentoMapper,
        private readonly transferenciaMapper: TransferenciaMapper,
    ) {}

    async executarEmTransacao<T>(
        trabalho: (contexto: PagamentoContextoTransacional) => Promise<T>,
    ): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const contexto: PagamentoContextoTransacional = {
                salvarPagamento: async (pagamento: Pagamento) => {
                    const modeloPagamento =
                        this.pagamentoMapper.toModel(pagamento);
                    await queryRunner.manager.save(modeloPagamento);
                },

                salvarTransferencia: async (transferencia: Transferencia) => {
                    const modeloTransferencia =
                        this.transferenciaMapper.toModel(transferencia);
                    await queryRunner.manager.save(modeloTransferencia);
                },

                salvarEvento: async (evento: OutboxEvent) => {
                    const modeloEvento = OutboxEventMapper.toModel(evento);
                    await queryRunner.manager.save(
                        OutboxEventModel,
                        modeloEvento,
                    );
                },
            };

            const resultado = await trabalho(contexto);

            await queryRunner.commitTransaction();

            return resultado;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();

            this.logger.error(
                `Transação falhou: ${error.message}`,
                error.stack,
            );

            throw new RepositoryException(`Erro ao salvar dados de Pagamento`);
        } finally {
            await queryRunner.release();
        }
    }
}
