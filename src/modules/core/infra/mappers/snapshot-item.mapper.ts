import { Injectable } from '@nestjs/common';
import { SnapshotItem } from '../../domain/aluguel';
import { SnapshotItemModel } from '../models/snapshot-item.value-object';

@Injectable()
export class SnapshotItemMapper {
    toDomain(model: SnapshotItemModel): SnapshotItem {
        return {
            id: model.itemId,
            nome: model.nome,
            descricao: model.descricao,
            precoDiaria: Number(model.precoDiaria),
            precoHora: model.precoHora ? Number(model.precoHora) : undefined,
            fotoUrl: model.fotoUrl,
            capturadoEm: model.capturadoEm,
            versao: model.versao,
            permiteAluguelPorHora: model.permiteAluguelPorHora,
            diasMinimosAluguel: model.diasMinimosAluguel,
            diasMaximosAluguel: model.diasMaximosAluguel,
            horasMinimosAluguel: model.horasMinimosAluguel,
            horasMaximosAluguel: model.horasMaximosAluguel,
            valorCaucao: model.valorCaucao
                ? Number(model.valorCaucao)
                : undefined,
            caucaoObrigatoria: model.caucaoObrigatoria,
        };
    }

    toModel(domain: SnapshotItem): SnapshotItemModel {
        const model = new SnapshotItemModel();
        Object.assign(model, {
            itemId: domain.id,
            nome: domain.nome,
            descricao: domain.descricao,
            precoDiaria: domain.precoDiaria,
            precoHora: domain.precoHora,
            fotoUrl: domain.fotoUrl,
            capturadoEm: domain.capturadoEm,
            versao: domain.versao,
            permiteAluguelPorHora: domain.permiteAluguelPorHora,
            diasMinimosAluguel: domain.diasMinimosAluguel,
            diasMaximosAluguel: domain.diasMaximosAluguel,
            horasMinimosAluguel: domain.horasMinimosAluguel,
            horasMaximosAluguel: domain.horasMaximosAluguel,
            valorCaucao: domain.valorCaucao,
            caucaoObrigatoria: domain.caucaoObrigatoria,
        });
        return model;
    }

    toDomainList(models: SnapshotItemModel[]): SnapshotItem[] {
        return models.map((model) => this.toDomain(model));
    }
}
