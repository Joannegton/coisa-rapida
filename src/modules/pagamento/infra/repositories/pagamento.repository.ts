import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagamentoModel } from '../models/pagamento.model';
import { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { PagamentoMapper } from '../mappers/pagamento.mapper';
import { Pagamento } from '../../domain/pagamento';

@Injectable()
export class PagamentoRepositoryImpl implements PagamentoRepository {
    private readonly logger = new Logger(PagamentoRepositoryImpl.name);

    constructor(
        @InjectRepository(PagamentoModel)
        private readonly repository: Repository<PagamentoModel>,
        private readonly pagamentoMapper: PagamentoMapper,
    ) {}

    async salvar(pagamento: Pagamento): Promise<void> {
        try {
            const pagamentoModel = this.pagamentoMapper.toModel(pagamento);
            await this.repository.save(pagamentoModel);
        } catch (error) {
            this.logger.error(
                `Erro ao salvar pagamento: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao salvar pagamento.');
        }
    }

    async buscarPorId(id: string): Promise<Pagamento | null> {
        try {
            const model = await this.repository.findOne({ where: { id } });
            return model ? this.pagamentoMapper.toDomain(model) : null;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar pagamento por ID: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar pagamento.');
        }
    }

    async buscarUltimoPorAluguelId(
        aluguelId: string,
    ): Promise<Pagamento | null> {
        try {
            const model = await this.repository.findOne({
                where: { aluguelId },
                order: { criadoEm: 'DESC' },
            });
            return model ? this.pagamentoMapper.toDomain(model) : null;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar último pagamento: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar pagamento.');
        }
    }
}
