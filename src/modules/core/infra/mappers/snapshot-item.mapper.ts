import { Injectable } from '@nestjs/common';
import { ItemSnapshot } from '../../domain/item-snapshot';
import { SnapshotItemModel } from '../models/snapshot-item.value-object';

@Injectable()
export class SnapshotItemMapper {
    toDomain(model: SnapshotItemModel): ItemSnapshot {
        return ItemSnapshot.carregar({
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
        });
    }

    toModel(domain: ItemSnapshot): SnapshotItemModel {
        return SnapshotItemModel.criar({
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
    }

    toDomainList(models: SnapshotItemModel[]): ItemSnapshot[] {
        return models.map((model) => this.toDomain(model));
    }
}
