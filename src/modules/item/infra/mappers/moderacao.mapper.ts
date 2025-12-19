import { Injectable } from '@nestjs/common';
import { Moderacao } from '../../domain/moderacao';
import { ModeracaoItemModel } from '../models/moderacao-item.model';

@Injectable()
export class ModeracaoMapper {
    toDomain(model: ModeracaoItemModel): Moderacao {
        const domain = Moderacao.carregar(
            {
                status: model.status,
                contemPalavrasProibidas: model.contemPalavrasProibidas,
                contemLinksExternos: model.contemLinksExternos,
                contemTelefone: model.contemTelefone,
                requerAprovacaoManual: model.requerAprovacaoManual,
                motivoBloqueio: model.motivoBloqueio,
                moderadorId: model.moderadorId,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
                dataResolucao: model.dataResolucao,
                observacoesModeração: model.observacoesModeração,
            },
            model.id,
        );
        return domain;
    }

    toModel(domain: Moderacao): ModeracaoItemModel {
        const model = ModeracaoItemModel.criar({
            contemLinksExternos: domain.contemLinksExternos,
            contemPalavrasProibidas: domain.contemPalavrasProibidas,
            contemTelefone: domain.contemTelefone,
            motivoBloqueio: domain.motivoBloqueio,
            requerAprovacaoManual: domain.requerAprovacaoManual,
            status: domain.status,
            moderadorId: domain.moderadorId,
            dataResolucao: domain.dataResolucao,
            observacoesModeração: domain.observacoesModeração,
        });
        return model;
    }
}
