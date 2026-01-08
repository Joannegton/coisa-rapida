import { Injectable } from '@nestjs/common';
import { Caucao } from '../../domain/caucao';
import { CaucaoModel } from '../models/caucao.value-object';

@Injectable()
export class CaucaoMapper {
    toDomain(model: CaucaoModel): Caucao {
        const domain = Caucao.carregar({
            valor: Number(model.valor),
            status: model.status,
            dataPagamento: model.dataPagamento,
            dataDevolucao: model.dataDevolucao,
        });
        return domain;
    }

    toModel(domain: Caucao): CaucaoModel {
        const model = CaucaoModel.criar({
            valor: domain.valor,
            status: domain.status,
            dataPagamento: domain.dataPagamento,
            dataDevolucao: domain.dataDevolucao,
        });
        return model;
    }
}
