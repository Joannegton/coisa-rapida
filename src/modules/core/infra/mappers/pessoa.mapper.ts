import { Injectable } from '@nestjs/common';
import { Pessoa } from '../../domain/pessoa';
import { PessoaModel } from '../models/pessoa.value-object';

@Injectable()
export class PessoaMapper {
    toDomain(model: PessoaModel): Pessoa {
        const domain = Pessoa.criar({
            id: model.id,
            nome: model.nome,
        });
        return domain;
    }

    toModel(domain: Pessoa): PessoaModel {
        const model = PessoaModel.criar({
            id: domain.id,
            nome: domain.nome,
        });
        return model;
    }
}
