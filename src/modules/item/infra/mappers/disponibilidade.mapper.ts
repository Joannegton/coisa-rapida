import { Injectable } from '@nestjs/common';
import { Disponibilidade } from '../../domain/disponibilidade';
import { DisponibilidadeItemModel } from '../models/disponibilidade-item.model';

@Injectable()
export class DisponibilidadeMapper {
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
                datasBloqueadas: model.datasBloqueadas,
                dataDisponibilidade: model.dataDisponibilidade,
                disponivel: model.disponivel,
            },
            model.id,
        );

        return domain;
    }
    toModel(domain: Disponibilidade): DisponibilidadeItemModel {
        const model = DisponibilidadeItemModel.criar({
            aprovacaoAutomatica: domain.aprovacaoAutomatica,
            diasMaximosAluguel: domain.diasMaximosAluguel,
            diasMinimosAluguel: domain.diasMinimosAluguel,
            horasMaximosAluguel: domain.horasMaximosAluguel,
            horasMinimosAluguel: domain.horasMinimosAluguel,
            permitAluguelsConsecutivos: domain.permitAluguelsConsecutivos,
            permiteAluguelPorHora: domain.permiteAluguelPorHora,
            dataDisponibilidade: domain.dataDisponibilidade,
            datasBloqueadas: domain.datasBloqueadas,
            disponivel: domain.disponivel,
        });
        return model;
    }
}
