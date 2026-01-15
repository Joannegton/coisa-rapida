import { Injectable, Logger } from '@nestjs/common';
import { ComprovanteResidencia } from '../../domain/ComprovanteResidencia';
import { ComprovanteResidenciaRepository } from '../../domain/repositories/comprovante-residencia.repository';
import { ComprovanteResidenciaModel } from '../models/comprovante-residencia.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComprovanteResidenciaMapper } from '../mappers/ComprovanteResidencia.mapper';
import { RepositoryException } from 'src/common/exceptions/repository.exception';

@Injectable()
export class ComprovanteResidenciaRepositoryImpl
    implements ComprovanteResidenciaRepository
{
    private readonly logger = new Logger(
        ComprovanteResidenciaRepositoryImpl.name,
    );

    constructor(
        @InjectRepository(ComprovanteResidenciaModel)
        private readonly repository: Repository<ComprovanteResidenciaModel>,
        private readonly comprovanteResidenciaMapper: ComprovanteResidenciaMapper,
    ) {}

    async salvar(comprovante: ComprovanteResidencia): Promise<void> {
        try {
            const model =
                this.comprovanteResidenciaMapper.domainToModel(comprovante);
            await this.repository.save(model);
        } catch (error) {
            this.logger.error(
                `Erro ao salvar comprovante de residência: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao salvar comprovante de residência',
            );
        }
    }

    async buscarPorId(id: string): Promise<ComprovanteResidencia | null> {
        try {
            const model = await this.repository.findOne({
                where: { id },
                relations: ['usuario'],
            });

            if (!model) {
                return null;
            }

            const domain =
                this.comprovanteResidenciaMapper.modelToDomain(model);
            return domain;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar comprovante de residência por ID: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao buscar comprovante de residência',
            );
        }
    }

    async buscarPorUsuarioId(
        usuarioId: string,
    ): Promise<ComprovanteResidencia | null> {
        try {
            const model = await this.repository.findOne({
                where: { usuario: { id: usuarioId } },
                relations: ['usuario'],
            });

            if (!model) {
                return null;
            }

            const domain =
                this.comprovanteResidenciaMapper.modelToDomain(model);
            return domain;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar comprovante de residência por ID: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao buscar comprovante de residência',
            );
        }
    }

    async listarTodos(): Promise<ComprovanteResidencia[]> {
        try {
            const models = await this.repository.find({
                relations: ['usuario'],
                order: { criadoEm: 'DESC' },
            });

            const domains = models.map((model) =>
                this.comprovanteResidenciaMapper.modelToDomain(model),
            );
            return domains;
        } catch (error) {
            this.logger.error(
                `Erro ao listar comprovantes de residência: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao listar comprovantes de residência',
            );
        }
    }

    async deletar(id: string): Promise<void> {
        try {
            await this.repository.delete(id);
        } catch (error) {
            this.logger.error(
                `Erro ao deletar comprovante de residência: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao deletar comprovante de residência',
            );
        }
    }
}
