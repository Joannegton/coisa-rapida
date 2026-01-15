import { Inject, Logger } from '@nestjs/common';
import {
    AluguelResult,
    AluguelService,
    AtualizarPagamentoProps,
} from '../../domain/services/aluguel.service';
import type { AluguelRepository } from 'src/modules/core/domain/repositories/aluguel.repository';
import { ServiceException } from 'src/common/exceptions/service.exception';

export class AluguelServiceImpl implements AluguelService {
    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
    ) {}

    private readonly logger = new Logger(AluguelServiceImpl.name);

    async buscar(aluguelId: string): Promise<AluguelResult | null> {
        try {
            const result = await this.aluguelRepository.buscar(aluguelId);
            if (!result) {
                return null;
            }

            const aluguel: AluguelResult = {
                id: result.id,
                locador: result.locador.toDto(),
                locatario: result.locatario.toDto(),
                item: {
                    id: result.itemId,
                    nome: result.itemSnapshot.nome,
                    descricao: result.itemSnapshot.descricao,
                    precoDiaria: result.itemSnapshot.precoDiaria,
                    precoHora: result.itemSnapshot.precoHora,
                },
                precoTotal: result.precoTotal,
                precoTotalComTaxa: result.precoTotalComTaxa,
                status: result.status,
                dataInicio: result.dataInicio,
                dataFim: result.dataFim,
                criadoEm: result.criadoEm,
                caucao: {
                    status: result.caucao?.status,
                    valor: result.caucao?.valor,
                    dataPagamento: result.caucao?.dataPagamento,
                    dataDevolucao: result.caucao?.dataDevolucao,
                },
                motivoRecusaLocador: result.motivoRecusaLocador,
                observacoesLocatario: result.observacoesLocatario,
            };

            return aluguel;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar aluguel ${aluguelId}: ${error.message}`,
            );
            throw new ServiceException('Erro ao buscar aluguel.');
        }
    }

    async atualizarPagamento(props: AtualizarPagamentoProps): Promise<void> {
        try {
            await this.aluguelRepository.atualizarPagamento({
                aluguelId: props.aluguelId,
                status: props.status,
                dataPagamento: props.dataPagamento,
                eCaucao: props.eCaucao,
            });
        } catch (error) {
            this.logger.error(
                `Erro ao atualizar pagamento do aluguel ${props.aluguelId}: ${error.message}`,
            );
            throw new ServiceException(
                'Erro ao atualizar pagamento do aluguel.',
            );
        }
    }
}
