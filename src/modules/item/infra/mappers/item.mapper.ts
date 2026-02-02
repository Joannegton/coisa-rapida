import { Injectable } from '@nestjs/common';
import { ItemModel } from '../models/item.model';
import { Item } from '../../domain/item';
import { PrecoMapper } from './preco.mapper';
import { DisponibilidadeMapper } from './disponibilidade.mapper';
import { ModeracaoMapper } from './moderacao.mapper';
import { FotoMapper } from './foto.mapper';
import { LocalizacaoMapper } from './localizacao.mapper';

@Injectable()
export class ItemMapper {
    constructor(
        private readonly precoMapper: PrecoMapper,
        private readonly disponibilidadeMapper: DisponibilidadeMapper,
        private readonly fotoMapper: FotoMapper,
        private readonly moderacaoMapper: ModeracaoMapper,
        private readonly localizacaoMapper: LocalizacaoMapper,
    ) {}

    toDomain(model: ItemModel, options?: { distanciaMetros?: number }): Item {
        const preco = this.precoMapper.toDomain(model.precos);
        const fotos = model.fotos
            ? this.fotoMapper.toDomainList(model.fotos)
            : [];
        const localizacao = this.localizacaoMapper.toDomain(model.localizacao);
        const disponibilidade = this.disponibilidadeMapper.toDomain(
            model.disponibilidade,
        );
        const moderacao = model.moderacao
            ? this.moderacaoMapper.toDomain(model.moderacao)
            : undefined;

        return Item.carregar(
            {
                usuarioId: model.usuarioId,
                nome: model.nome,
                descricao: model.descricao,
                categoria: model.categoria,
                estado: model.estado,
                tipoAnuncio: model.tipoAnuncio,
                versao: model.versao,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
                dataArquivamento: model.dataArquivamento,
                dataExclusao: model.dataExclusao,
                aluguelsTotais: model.aluguelsTotais,
                precos: preco,
                localizacao: localizacao,
                status: model.status,
                disponibilidade: disponibilidade,
                moderacao: moderacao,
                fotos: fotos,
                distanciaMetros: options?.distanciaMetros,
            },
            model.id,
        );
    }

    toModel(item: Item): ItemModel {
        const precos = this.precoMapper.toModel(item.precos);
        const fotos = this.fotoMapper.toModelList(item.fotos);
        const disponibilidade = item.disponibilidade
            ? this.disponibilidadeMapper.toModel(item.disponibilidade)
            : undefined;
        const moderacao = item.moderacao
            ? this.moderacaoMapper.toModel(item.moderacao)
            : undefined;
        const localizacao = this.localizacaoMapper.toModel(item.localizacao);

        const model = ItemModel.criar({
            id: item.id,
            usuarioId: item.usuarioId,
            nome: item.nome,
            descricao: item.descricao,
            categoria: item.categoria,
            estado: item.estado,
            tipoAnuncio: item.tipoAnuncio,
            status: item.status,
            aluguelsTotais: item.aluguelsTotais,
            versao: item.versao,
            criadoEm: item.criadoEm,
            atualizadoEm: item.atualizadoEm,
            dataArquivamento: item.dataArquivamento,
            dataExclusao: item.dataExclusao,
            regrasDeUso: item.regrasDeUso,
            disponibilidade: disponibilidade,
            precos: precos,
            fotos: fotos,
            moderacao: moderacao,
            localizacao: localizacao,
        });

        return model;
    }

    toDomainList(models: ItemModel[]): Item[] {
        return models.map((model) => this.toDomain(model));
    }
}
