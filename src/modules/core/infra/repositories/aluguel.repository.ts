import { InjectRepository } from '@nestjs/typeorm';
import { Aluguel } from '../../domain/aluguel';
import { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelModel } from '../models/aluguel.model';
import { Repository } from 'typeorm';
import { AluguelMapper } from '../mappers/aluguel.mapper';
import { Logger } from '@nestjs/common';
import { RepositoryException } from 'src/common/exceptions/repository.exception';

export class AluguelRepositoryImpl implements AluguelRepository {
    private readonly logger: Logger = new Logger(AluguelRepositoryImpl.name);
    constructor(
        @InjectRepository(AluguelModel)
        private readonly aluguelRepository: Repository<AluguelModel>,
        private readonly aluguelMapper: AluguelMapper,
    ) {}

    async salvar(aluguel: Aluguel): Promise<void> {
        try {
            const aluguelModel = this.aluguelMapper.toModel(aluguel);
            await this.aluguelRepository.save(aluguelModel);
        } catch (error) {
            this.logger.error(`Erro ao salvar aluguel: ${error.message}`);
            throw new RepositoryException('Erro ao salvar aluguel.');
        }
    }

    async buscar(id: string): Promise<Aluguel | null> {
        try {
            const aluguelModel = await this.aluguelRepository.findOne({
                where: { id },
            });

            if (!aluguelModel) {
                return null;
            }

            return this.aluguelMapper.toDomain(aluguelModel);
        } catch (error) {
            this.logger.error(`Erro ao buscar aluguel ${id}: ${error.message}`);
            throw new RepositoryException(`Erro ao buscar aluguel ${id}`);
        }
    }
}
