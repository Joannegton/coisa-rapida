import { Injectable } from '@nestjs/common';
import { Preco } from '../../domain/precos';
import { PrecosItemModel } from '../models/precos-item.value-object';

@Injectable()
export class PrecoMapper {
    toDomain(modoel: PrecosItemModel): Preco {
        const domain = Preco.carregar({
            caucaoObrigatoria: modoel.caucaoObrigatoria,
            precoPorDia: Number(modoel.precoPorDia),
            precoPorHora: modoel.precoPorHora,
            valorCaucao: modoel.valorCaucao,
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
