import { Injectable } from '@nestjs/common';
import {
    Disponibilidade,
    DataBloqueada as DataBloqueadaDomain,
} from '../../domain/disponibilidade';
import {
    DisponibilidadeItemModel,
    DataBloqueada as DataBloqueadaModel,
} from '../models/disponibilidade-item.model';

@Injectable()
export class DisponibilidadeMapper {
    private convertDataBloqueadaToModel(
        dataBloqueada: DataBloqueadaDomain,
    ): DataBloqueadaModel {
        return {
            dataInicio: dataBloqueada.dataInicio.toISOString(),
            dataFim: dataBloqueada.dataFim.toISOString(),
            motivo: dataBloqueada.motivo,
        };
    }

    private convertDataBloqueadaToDomain(
        dataBloqueada: DataBloqueadaModel,
    ): DataBloqueadaDomain {
        return {
            dataInicio: new Date(dataBloqueada.dataInicio),
            dataFim: new Date(dataBloqueada.dataFim),
            motivo: dataBloqueada.motivo,
        };
    }

    toDomain(model: DisponibilidadeItemModel): Disponibilidade {
        const domain = Disponibilidade.carregar(
            {
                aprovacaoAutomatica: model.aprovacaoAutomatica,
                diasMaximosAluguel: model.diasMaximosAluguel,
                diasMinimosAluguel: model.diasMinimosAluguel,
                horasMaximosAluguel: model.horasMaximosAluguel,
                horasMinimosAluguel: model.horasMinimosAluguel,
                permitAluguelsConsecutivos: model.permitAluguelsConsecutivos,
                permiteAluguelPorHora: model.permiteAluguelPorHora,
                datasBloqueadas: model.datasBloqueadas?.map((db) =>
                    this.convertDataBloqueadaToDomain(db),
                ),
                dataDisponibilidade: model.dataDisponibilidade,
                disponivel: model.disponivel,
            },
            model.id,
        );

        return domain;
    }

    toModel(domain: Disponibilidade): DisponibilidadeItemModel {
        const model = DisponibilidadeItemModel.criar({
            id: domain.id,
            aprovacaoAutomatica: domain.aprovacaoAutomatica,
            diasMaximosAluguel: domain.diasMaximosAluguel,
            diasMinimosAluguel: domain.diasMinimosAluguel,
            horasMaximosAluguel: domain.horasMaximosAluguel,
            horasMinimosAluguel: domain.horasMinimosAluguel,
            permitAluguelsConsecutivos: domain.permitAluguelsConsecutivos,
            permiteAluguelPorHora: domain.permiteAluguelPorHora,
            dataDisponibilidade: domain.dataDisponibilidade,
            datasBloqueadas: domain.datasBloqueadas?.map((db) =>
                this.convertDataBloqueadaToModel(db),
            ),
            disponivel: domain.disponivel,
        });
        return model;
    }
}
