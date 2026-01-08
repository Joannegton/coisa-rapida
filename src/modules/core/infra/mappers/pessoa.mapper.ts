import { Injectable } from '@nestjs/common';
import { Pessoa } from '../../domain/pessoa';
import {
    LocadorModel,
    LocatarioModel,
} from '../models/pessoa-aluguel.value-object';

@Injectable()
export class PessoaMapper {
    toDomain(model: LocadorModel | LocatarioModel): Pessoa {
        const domain = Pessoa.criar({
            id: model.id,
            nome: model.nome,
        });
        return domain;
    }

    toLocadorModel(domain: Pessoa): LocadorModel {
        return LocadorModel.criar({
            id: domain.id,
            nome: domain.nome,
        });
    }

    toLocatarioModel(domain: Pessoa): LocatarioModel {
        return LocatarioModel.criar({
            id: domain.id,
            nome: domain.nome,
        });
    }
}
