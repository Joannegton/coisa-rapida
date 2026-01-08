import { Injectable } from '@nestjs/common';
import { Aluguel } from '../../domain/aluguel';
import { AluguelModel } from '../models/aluguel.model';
import { CaucaoMapper } from './caucao.mapper';
import { MultaMapper } from './multa.mapper';
import { ContratoMapper } from './contrato.mapper';
import { PessoaMapper } from './pessoa.mapper';
import { SnapshotItemMapper } from './snapshot-item.mapper';

@Injectable()
export class AluguelMapper {
    constructor(
        private readonly caucaoMapper: CaucaoMapper,
        private readonly multaMapper: MultaMapper,
        private readonly contratoMapper: ContratoMapper,
        private readonly pessoaMapper: PessoaMapper,
        private readonly snapshotItemMapper: SnapshotItemMapper,
    ) {}

    toDomain(model: AluguelModel): Aluguel {
        const locador = this.pessoaMapper.toDomain(model.locador);
        const locatario = this.pessoaMapper.toDomain(model.locatario);

        const caucao = model.caucao
            ? this.caucaoMapper.toDomain(model.caucao)
            : undefined;

        const multa = model.multa
            ? this.multaMapper.toDomain(model.multa)
            : undefined;
        const contrato = this.contratoMapper.toDomain(model.contrato);
        const itemSnapshot = this.snapshotItemMapper.toDomain(
            model.snapshotItem,
        );

        return Aluguel.carregar(
            {
                locador: locador,
                locatario: locatario,
                itemId: model.itemId,
                itemSnapshot: itemSnapshot,
                precoTotal: Number(model.precoTotal),
                dataInicio: model.dataInicio,
                dataFim: model.dataFim,
                status: model.status,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
                caucao: caucao,
                multa: multa,
                contrato: contrato,
                observacoesLocatario: model.observacoesLocatario,
                motivoRecusaLocador: model.motivoRecusaLocador,
            },
            model.id,
        );
    }

    toModel(aluguel: Aluguel): AluguelModel {
        const locadorModel = this.pessoaMapper.toLocadorModel(aluguel.locador);
        const locatarioModel = this.pessoaMapper.toLocatarioModel(aluguel.locatario);

        const caucaoModel = aluguel.caucao
            ? this.caucaoMapper.toModel(aluguel.caucao)
            : undefined;

        const multaModel = aluguel.multa
            ? this.multaMapper.toModel(aluguel.multa)
            : undefined;
        const contratoModel = this.contratoMapper.toModel(aluguel.contrato);

        const itemSnapshotModel = this.snapshotItemMapper.toModel(
            aluguel.itemSnapshot,
        );

        const model = AluguelModel.criar({
            id: aluguel.id,
            locador: locadorModel,
            locatario: locatarioModel,
            itemId: aluguel.itemId,
            snapshotItem: itemSnapshotModel,
            precoTotal: aluguel.precoTotal,
            caucao: caucaoModel,
            multa: multaModel,
            contrato: contratoModel,
            dataInicio: aluguel.dataInicio,
            dataFim: aluguel.dataFim,
            status: aluguel.status,
            criadoEm: aluguel.criadoEm,
            atualizadoEm: aluguel.atualizadoEm,
            observacoesLocatario: aluguel.observacoesLocatario,
            motivoRecusaLocador: aluguel.motivoRecusaLocador,
        });

        return model;
    }

    toDomainList(models: AluguelModel[]): Aluguel[] {
        return models.map((model) => this.toDomain(model));
    }
}
