import { Injectable } from '@nestjs/common';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';
import { VerificacaoResidenciaRepository } from '../../infra/repositories/VerificacaoResidencia.repository';
import { VerificacaoPendenteDto } from './ListarVerificacoesPendentes.usecase';

@Injectable()
export class BuscarVerificacaoPorIdQuery {
    constructor(
        private readonly verificacaoRepository: VerificacaoResidenciaRepository,
    ) {}

    async execute(id: string): ResultadoAssincrono<VerificacaoPendenteDto, ServicoExcecao> {
        try {
            // Buscar verificações pendentes
            const verificacaoResult = await this.verificacaoRepository.buscarPorId(id);
            if (verificacaoResult.ehFalha()) {
                return ResultadoUtil.falha(verificacaoResult.erro || new ServicoExcecao('Erro ao listar verificações'));
            };

            return ResultadoUtil.sucesso(verificacaoResult.valor?.toDto()!);
        } catch (error) {
            return ResultadoUtil.falha(new ServicoExcecao(error?.message || 'Erro ao listar verificações pendentes'));
        }
    }
}
