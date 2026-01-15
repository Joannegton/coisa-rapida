import { Injectable } from '@nestjs/common';
import { Preco } from '../../domain/precos';
import { PrecosItemModel } from '../models/precos-item.value-object';

@Injectable()
export class PrecoMapper {
    toDomain(model: PrecosItemModel): Preco {
        const domain = Preco.carregar({
            caucaoObrigatoria: model.caucaoObrigatoria ?? false,
            precoPorDia: Number(model.precoPorDia),
            precoPorHora: model.precoPorHora
                ? Number(model.precoPorHora)
                : undefined,
            valorCaucao: model.valorCaucao
                ? Number(model.valorCaucao)
                : undefined,
        });
        return domain;
    }

    toModel(domain: Preco): PrecosItemModel {
        const model = PrecosItemModel.criar({
            precoPorDia: domain.precoPorDia,
            precoPorHora: domain.precoPorHora,
            valorCaucao: domain.valorCaucao,
            caucaoObrigatoria: domain.caucaoObrigatoria,
        });
        return model;
    }
}
