import { Injectable } from '@nestjs/common';
import { ComprovanteResidencia } from '../../domain/ComprovanteResidencia';
import { ComprovanteResidenciaModel } from '../models/comprovante-residencia.model';

@Injectable()
export class ComprovanteResidenciaMapper {
    modelToDomain(model: ComprovanteResidenciaModel): ComprovanteResidencia {
        const comprovante = ComprovanteResidencia.carregar(
            {
                comprovanteUrl: model.comprovanteUrl,
                tipoComprovante: model.tipoComprovante,
                observacoesUsuario: model.observacoesUsuario,
                usuarioId: model.usuarioId,
                status: model.status,
                moderadorId: model.moderadorId,
                observacoesModerador: model.observacoesModerador,
                motivoRejeicao: model.motivoRejeicao,
                dataConclusao: model.dataConclusao,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
            },
            model.id,
        );
        return comprovante;
    }

    domainToModel(domain: ComprovanteResidencia): ComprovanteResidenciaModel {
        const comprovanteModel = ComprovanteResidenciaModel.criar({
            id: domain.id,
            comprovanteUrl: domain.comprovanteUrl,
            tipoComprovante: domain.tipoComprovante,
            observacoesUsuario: domain.observacoesUsuario,
            usuarioId: domain.usuarioId,
            status: domain.status,
            moderadorId: domain.moderadorId,
            observacoesModerador: domain.observacoesModerador,
            motivoRejeicao: domain.motivoRejeicao,
            dataConclusao: domain.dataConclusao,
        });

        return comprovanteModel;
    }

    modelToDomainList(
        models: ComprovanteResidenciaModel[],
    ): ComprovanteResidencia[] {
        return models.map((model) => this.modelToDomain(model));
    }

    domainToModelList(
        domains: ComprovanteResidencia[],
    ): ComprovanteResidenciaModel[] {
        return domains.map((domain) => this.domainToModel(domain));
    }
}
