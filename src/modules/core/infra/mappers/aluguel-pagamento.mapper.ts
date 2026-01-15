import { Injectable } from '@nestjs/common';
import { AluguelPagamento } from '../../domain/aluguel-pagamento';
import { AluguelPagamentoModel } from '../models/aluguel-pagamento.value-object';

@Injectable()
export class AluguelPagamentoMapper {
    toDomain(model: AluguelPagamentoModel): AluguelPagamento {
        return AluguelPagamento.carregar({
            valor: model.valor ? Number(model.valor) : undefined,
            status: model.status,
            dataPagamento: model.dataPagamento,
        });
    }

    toModel(aluguelPagamento: AluguelPagamento): AluguelPagamentoModel {
        const model = new AluguelPagamentoModel();
        model.valor = aluguelPagamento.valor;
        model.status = aluguelPagamento.status;
        model.dataPagamento = aluguelPagamento.dataPagamento;
        return model;
    }
}
