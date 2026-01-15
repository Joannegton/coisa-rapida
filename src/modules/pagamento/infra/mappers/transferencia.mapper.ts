import { Injectable } from '@nestjs/common';
import { TransferenciaModel } from '../models/transferencia.model';
import { Transferencia } from '../../domain/transferencia';

@Injectable()
export class TransferenciaMapper {
    /**
     * Converte um domain Transferencia para um TransferenciaModel (ORM)
     */
    toModel(domain: Transferencia): Partial<TransferenciaModel> {
        return {
            id: domain.id,
            aluguelId: domain.aluguelId,
            usuarioId: domain.usuarioId,
            tipo: domain.tipo,
            valor: domain.valor,
            status: domain.status,
            mercadoPagoTransfId: domain.mercadoPagoTransfId,
            descricao: domain.descricao,
            motivoFalha: domain.motivoFalha,
            criadoEm: domain.criadoEm,
            atualizadoEm: domain.atualizadoEm,
            completadoEm: domain.completadoEm,
        };
    }

    /**
     * Converte um TransferenciaModel (ORM) para um domain Transferencia
     */
    toDomain(model: TransferenciaModel): Transferencia {
        return Transferencia.carregar(
            {
                aluguelId: model.aluguelId,
                usuarioId: model.usuarioId,
                tipo: model.tipo,
                valor: Number(model.valor),
                status: model.status,
                mercadoPagoTransfId: model.mercadoPagoTransfId,
                descricao: model.descricao,
                motivoFalha: model.motivoFalha,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
                completadoEm: model.completadoEm,
            },
            model.id,
        );
    }

    /**
     * Serializa um domain Transferencia para DTO
     */
    toDto(domain: Transferencia) {
        return domain.toDto();
    }
}
