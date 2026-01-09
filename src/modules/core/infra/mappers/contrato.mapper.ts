import { Injectable } from '@nestjs/common';
import { Contrato } from '../../domain/contrato';
import {
    ContratoModel,
    AceiteContratoModel,
} from '../models/contrato.value-object';

@Injectable()
export class ContratoMapper {
    toDomain(model: ContratoModel): Contrato {
        const domain = Contrato.carregar({
            versao: Number(model.versao),
            aceiteLocador: model.aceiteLocador ?? undefined,
            aceiteLocatario: model.aceiteLocatario ?? undefined,
            criadoEm: model.criadoEm,
        });
        return domain;
    }

    toModel(domain: Contrato): ContratoModel {
        const model = ContratoModel.criar({
            versao: domain.versao.toString(),
            aceiteLocador: domain.aceiteLocador as AceiteContratoModel,
            aceiteLocatario: domain.aceiteLocatario as AceiteContratoModel,
            criadoEm: domain.criadoEm,
        });
        return model;
    }
}
