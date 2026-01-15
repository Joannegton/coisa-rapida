import { Injectable } from '@nestjs/common';
import { PagamentoModel } from '../models/pagamento.model';
import { Pagamento } from '../../domain/pagamento';

@Injectable()
export class PagamentoMapper {
    toModel(domain: Pagamento): Partial<PagamentoModel> {
        return {
            id: domain.id,
            aluguelId: domain.aluguelId,
            usuarioId: domain.usuarioId,
            tipo: domain.tipo,
            mercadoPagoPagamentoId: domain.mercadoPagoPagamentoId,
            mercadoPagoPreferenciaId: domain.mercadoPagoPreferenciaId,
            valor: domain.valor,
            status: domain.status,
            metodoPagamento: domain.metodoPagamento,
            dadosMercadoPago: domain.dadosMercadoPago,
            motivoRejeicao: domain.motivoRejeicao,
            criadoEm: domain.criadoEm,
            atualizadoEm: domain.atualizadoEm,
            aprovadoEm: domain.aprovadoEm,
        };
    }

    toDomain(model: PagamentoModel): Pagamento {
        return Pagamento.carregar(
            {
                aluguelId: model.aluguelId,
                usuarioId: model.usuarioId,
                tipo: model.tipo,
                mercadoPagoPagamentoId: model.mercadoPagoPagamentoId,
                mercadoPagoPreferenciaId: model.mercadoPagoPreferenciaId,
                valor: Number(model.valor),
                status: model.status,
                metodoPagamento: model.metodoPagamento,
                dadosMercadoPago: model.dadosMercadoPago,
                motivoRejeicao: model.motivoRejeicao,
                criadoEm: model.criadoEm,
                atualizadoEm: model.atualizadoEm,
                aprovadoEm: model.aprovadoEm,
            },
            model.id,
        );
    }
}
