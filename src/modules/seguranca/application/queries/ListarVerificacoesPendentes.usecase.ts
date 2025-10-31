import { Injectable } from '@nestjs/common';
import { ResultadoAssincrono, ResultadoUtil, ServicoExcecao } from '../../../../shared/resultado';
import { VerificacaoResidenciaRepository } from '../../infra/repositories/VerificacaoResidencia.repository';

export type VerificacaoPendenteDto = {
    id: string;
    comprovanteUrl: string;
    tipoComprovante: string;
    observacoesUsuario?: string;
    dataSubmissao: Date;
    usuario: {
        id: string;
        nome: string;
        cpf?: string;
        email: string;
        telefone?: string;
        endereco?: EnderecoDto;
    };
};

export type EnderecoDto = {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pais?: string;
    latitude?: number;
    longitude?: number;
};

@Injectable()
export class ListarVerificacoesPendentesUseCase {
    constructor(
        private readonly verificacaoRepository: VerificacaoResidenciaRepository,
    ) {}

    async execute(limite: number): ResultadoAssincrono<VerificacaoPendenteDto[], ServicoExcecao> {
        try {
            // Buscar verificações pendentes
            const verificacoesResult = await this.verificacaoRepository.listarPendentes(limite);
            if (verificacoesResult.ehFalha()) {
                return ResultadoUtil.falha(verificacoesResult.erro || new ServicoExcecao('Erro ao listar verificações'));
            };

            // Buscar dados dos usuários
            const verificacoesComUsuario = verificacoesResult.valor?.map(v => v.toDto());

            return ResultadoUtil.sucesso(verificacoesComUsuario);
        } catch (error) {
            return ResultadoUtil.falha(new ServicoExcecao(error?.message || 'Erro ao listar verificações pendentes'));
        }
    }
}
