import { InjectRepository } from '@nestjs/typeorm';
import { Aluguel } from '../../domain/aluguel';
import {
    AluguelRepository,
    AtualizarPagamentoProps,
} from '../../domain/repositories/aluguel.repository';
import { AluguelModel, AluguelStatus } from '../models/aluguel.model';
import { Repository } from 'typeorm';
import { AluguelMapper } from '../mappers/aluguel.mapper';
import { Logger } from '@nestjs/common';
import { RepositoryException } from 'src/common/exceptions/repository.exception';
import { StatusCaucao } from '../models/caucao.value-object';
import { AluguelPagamentoStatusModel } from '../models/aluguel-pagamento.value-object';

export class AluguelRepositoryImpl implements AluguelRepository {
    private readonly logger: Logger = new Logger(AluguelRepositoryImpl.name);
    constructor(
        @InjectRepository(AluguelModel)
        private readonly repository: Repository<AluguelModel>,
        private readonly aluguelMapper: AluguelMapper,
    ) {}

    async salvar(aluguel: Aluguel): Promise<Aluguel> {
        try {
            const aluguelModel = this.aluguelMapper.toModel(aluguel);
            const aluguelSalvo = await this.repository.save(aluguelModel);
            return this.aluguelMapper.toDomain(aluguelSalvo);
        } catch (error) {
            this.logger.error(`Erro ao salvar aluguel: ${error.message}`);
            throw new RepositoryException('Erro ao salvar aluguel.');
        }
    }

    async buscar(id: string): Promise<Aluguel | null> {
        try {
            const aluguelModel = await this.repository.findOne({
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

    async listarPorUsuario(usuarioId: string): Promise<Aluguel[]> {
        try {
            const models = await this.repository.find({
                where: [
                    { locador: { id: usuarioId } },
                    { locatario: { id: usuarioId } },
                ],
                order: { criadoEm: 'DESC' },
            });

            return this.aluguelMapper.toDomainList(models);
        } catch (error) {
            this.logger.error(
                `Erro ao listar aluguéis do usuário ${usuarioId}: ${error.message}`,
            );
            throw new RepositoryException(`Erro ao listar aluguéis`);
        }
    }

    async atualizarPagamento(props: AtualizarPagamentoProps): Promise<void> {
        try {
            const updateData: any = {};

            if (props.eCaucao) {
                updateData.caucao = {
                    status: props.status,
                };
                if (props.dataPagamento) {
                    updateData['caucao.dataPagamento'] = props.dataPagamento;
                }
            } else {
                updateData.aluguelPagamento = {
                    status: props.status,
                };
                if (props.dataPagamento) {
                    updateData['aluguelPagamento.dataPagamento'] =
                        props.dataPagamento;
                }
            }

            if (
                props.status === StatusCaucao.PAGA ||
                props.status === AluguelPagamentoStatusModel.PAGO
            ) {
                updateData['status'] = AluguelStatus.SOLICITADO;
            }

            await this.repository.update({ id: props.aluguelId }, updateData);
        } catch (error) {
            this.logger.error(
                `Erro ao atualizar pagamento do aluguel ${props.aluguelId}: ${error.message}`,
            );
            throw new RepositoryException(
                `Erro ao atualizar pagamento do aluguel`,
            );
        }
    }
}
