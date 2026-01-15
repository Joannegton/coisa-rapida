import { Injectable } from '@nestjs/common';
import { Foto } from '../../domain/foto';
import { FotosItemModel } from '../models/fotos-item.model';

@Injectable()
export class FotoMapper {
    toDomain(model: FotosItemModel): Foto {
        const domain = Foto.carregar(
            {
                url: model.url,
                ordem: model.ordem,
                principal: model.principal,
                nomeArquivo: model.nomeArquivo,
                tamanhoBytes: model.tamanhoBytes,
                criadoEm: model.criadoEm,
                publicIdCloudinary: model.publicIdCloudinary,
            },
            model.id,
        );
        return domain;
    }

    toModel(domain: Foto): FotosItemModel {
        const model = FotosItemModel.criar({
            id: domain.id,
            url: domain.url,
            ordem: domain.ordem,
            principal: domain.principal,
            nomeArquivo: domain.nomeArquivo,
            tamanhoBytes: domain.tamanhoBytes,
            publicIdCloudinary: domain.publicIdCloudinary,
        });
        return model;
    }

    toDomainList(models: FotosItemModel[]): Foto[] {
        return models.map((model) => this.toDomain(model));
    }

    toModelList(domains: Foto[]): FotosItemModel[] {
        return domains.map((domain) => this.toModel(domain));
    }
}
