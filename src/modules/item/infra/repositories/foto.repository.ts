import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FotosItemModel } from '../models/fotos-item.model';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { Foto } from '../../domain/foto';
import { FotoMapper } from '../mappers/foto.mapper';
import { FotoRepository } from '../../domain/repositories/foto.repository';

@Injectable()
export class FotoRepositoryImpl implements FotoRepository {
    private readonly logger = new Logger(FotoRepositoryImpl.name);

    constructor(
        @InjectRepository(FotosItemModel)
        private readonly repository: Repository<FotosItemModel>,
        private readonly fotoMapper: FotoMapper,
    ) {}

    async salvar(fotos: Foto[]): Promise<Foto[]> {
        try {
            const models = this.fotoMapper.toModelList(fotos);
            const savedModels = await this.repository.save(models);
            return this.fotoMapper.toDomainList(savedModels);
        } catch (error) {
            this.logger.error(`Erro ao inserir fotos: ${error.message}`);
            throw new RepositoryException('Erro ao inserir fotos');
        }
    }

    async tornarPrincipal(fotoId: string, itemId: string): Promise<void> {
        try {
            await this.repository.update({ itemId }, { principal: false });

            await this.repository.update({ id: fotoId }, { principal: true });
        } catch (error) {
            this.logger.error(`Erro ao tornar principal: ${error.message}`);
            throw new RepositoryException('Erro ao atualizar foto principal');
        }
    }

    async recalcularOrdem(itemId: string): Promise<void> {
        try {
            const fotos = await this.repository.find({
                where: { itemId },
                order: { criadoEm: 'ASC' },
            });

            for (let i = 0; i < fotos.length; i++) {
                fotos[i].ordem = i + 1;
            }

            await this.repository.save(fotos);
        } catch (error) {
            this.logger.error(`Erro ao recalcular ordem: ${error.message}`);
            throw new RepositoryException('Erro ao recalcular ordem de fotos');
        }
    }

    async atualizarOrdem(
        atualizacoes: { id: string; ordem: number }[],
    ): Promise<void> {
        try {
            for (const { id, ordem } of atualizacoes) {
                await this.repository.update(id, { ordem });
            }
        } catch (error) {
            this.logger.error(`Erro ao atualizar ordem: ${error.message}`);
            throw new RepositoryException('Erro ao atualizar ordem de fotos');
        }
    }

    async listarPorItem(itemId: string): Promise<Foto[]> {
        try {
            const models = await this.repository.find({
                where: { itemId },
                order: { ordem: 'ASC' },
            });
            return this.fotoMapper.toDomainList(models);
        } catch (error) {
            this.logger.error(`Erro ao listar fotos do item: ${error.message}`);
            throw new RepositoryException('Erro ao listar fotos');
        }
    }

    async remover(id: string): Promise<void> {
        try {
            await this.repository.delete(id);
        } catch (error) {
            this.logger.error(`Erro ao remover foto: ${error.message}`);
            throw new RepositoryException('Erro ao remover foto');
        }
    }
}
