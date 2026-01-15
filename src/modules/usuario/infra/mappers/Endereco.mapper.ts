import { Injectable } from '@nestjs/common';
import { Endereco } from '../../domain/Endereco';
import { EnderecoModel } from '../models/endereco.value-objct';

@Injectable()
export class EnderecoMapper {
    modelToDomain(model: EnderecoModel): Endereco {
        return Endereco.carregar({
            cep: model.cep,
            rua: model.rua,
            numero: model.numero,
            complemento: model.complemento,
            bairro: model.bairro,
            cidade: model.cidade,
            estado: model.estado,
            pais: model.pais,
            latitude: model.latitude,
            longitude: model.longitude,
        });
    }

    domainToModel(domain: Endereco): EnderecoModel {
        const enderecoModel = EnderecoModel.criar({
            cep: domain.cep,
            rua: domain.rua,
            numero: domain.numero,
            complemento: domain.complemento,
            bairro: domain.bairro,
            cidade: domain.cidade,
            estado: domain.estado,
            pais: domain.pais,
            latitude: domain.latitude,
            longitude: domain.longitude,
        });

        return enderecoModel;
    }
}
