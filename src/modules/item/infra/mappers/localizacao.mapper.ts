import { Injectable } from '@nestjs/common';
import { LocalizacaoItem } from '../../domain/localizacao';
import { LocalizacaoItemModel } from '../models/localizacao-item.value-object';

@Injectable()
export class LocalizacaoMapper {
    toDomain(model: LocalizacaoItemModel) {
        const domain = LocalizacaoItem.criar({
            cep: model.cep,
            bairro: model.bairro,
            cidade: model.cidade,
            estado: model.estado,
            endereco: model.endereco,
            latitude: model.latitude,
            longitude: model.longitude,
        });

        return domain;
    }

    toModel(domain: LocalizacaoItem) {
        const model = LocalizacaoItemModel.criar({
            bairro: domain.bairro,
            cep: domain.cep,
            cidade: domain.cidade,
            estado: domain.estado,
            endereco: domain.endereco,
            latitude: domain.latitude,
            longitude: domain.longitude,
        });
        return model;
    }
}
