import { Injectable } from '@nestjs/common';
import { Multa } from '../../domain/multa';
import { MultaModel } from '../models/multa.value-object';

@Injectable()
export class MultaMapper {
    toDomain(model: MultaModel): Multa {
        const domain = Multa.carregar({
            diasAtraso: model.diasAtraso,
            multiplicador: Number(model.multiplicador),
            valorDiariaSnapshot: Number(model.valorDiariaSnapshot),
            valorTotal: Number(model.valorTotal),
            motivo: model.motivo,
            calculadaEm: model.calculadaEm,
        });
        return domain;
    }

    toModel(domain: Multa): MultaModel {
        const model = MultaModel.criar({
            diasAtraso: domain.diasAtraso,
            multiplicador: domain.multiplicador,
            valorDiariaSnapshot: domain.valorDiariaSnapshot,
            valorTotal: domain.valorTotal,
            motivo: domain.motivo,
            calculadaEm: domain.calculadaEm,
        });
        return model;
    }
}
