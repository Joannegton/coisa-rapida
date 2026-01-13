import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    TransferenciaModel,
    StatusTransferencia,
    TipoTransferencia,
} from '../models/transferencia.model';
import { TransferenciaRepository } from '../../domain/repositories/transferencia.repository';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { TransferenciaMapper } from '../mappers/transferencia.mapper';
import { Transferencia } from '../../domain/transferencia';

@Injectable()
export class TransferenciaRepositoryImpl implements TransferenciaRepository {
    private readonly logger = new Logger(TransferenciaRepositoryImpl.name);

    constructor(
        @InjectRepository(TransferenciaModel)
        private readonly repo: Repository<TransferenciaModel>,
        private readonly transferenciaMapper: TransferenciaMapper,
    ) {}

    async salvar(transferencia: Transferencia): Promise<void> {
        try {
            const model = this.transferenciaMapper.toModel(transferencia);
            await this.repo.save(model);
        } catch (error) {
            this.logger.error(
                `Erro ao salvar transferência: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao salvar transferência.');
        }
    }

    async buscarPorId(id: string): Promise<Transferencia | null> {
        try {
            const model = await this.repo.findOne({ where: { id } });
            return model ? this.transferenciaMapper.toDomain(model) : null;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar transferência por ID: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar transferência.');
        }
    }

    async buscarPorAluguelId(aluguelId: string): Promise<Transferencia[]> {
        try {
            const models = await this.repo.find({
                where: { aluguelId },
                order: { criadoEm: 'DESC' },
            });
            return models.map(m => this.transferenciaMapper.toDomain(m));
        } catch (error) {
            this.logger.error(
                `Erro ao buscar transferências por aluguelId: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar transferências.');
        }
    }

    async buscarPorAluguelIdETipo(
        aluguelId: string,
        tipo: TipoTransferencia,
    ): Promise<Transferencia | null> {
        try {
            const model = await this.repo.findOne({
                where: { aluguelId, tipo },
                order: { criadoEm: 'DESC' },
            });
            return model ? this.transferenciaMapper.toDomain(model) : null;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar transferência por aluguelId e tipo: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar transferência.');
        }
    }

    async buscarPorStatus(
        status: StatusTransferencia,
    ): Promise<Transferencia[]> {
        try {
            const models = await this.repo.find({
                where: { status },
                order: { criadoEm: 'ASC' },
            });
            return models.map(m => this.transferenciaMapper.toDomain(m));
        } catch (error) {
            this.logger.error(
                `Erro ao buscar transferências por status: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar transferências.');
        }
    }

    async buscarAguardandoManual(): Promise<Transferencia[]> {
        try {
            const models = await this.repo.find({
                where: {
                    status: StatusTransferencia.AGUARDANDO_TRANSFERENCIA_MANUAL,
                },
                order: { criadoEm: 'ASC' },
            });
            return models.map(m => this.transferenciaMapper.toDomain(m));
        } catch (error) {
            this.logger.error(
                `Erro ao buscar transferências aguardando manual: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar transferências.');
        }
    }
}
