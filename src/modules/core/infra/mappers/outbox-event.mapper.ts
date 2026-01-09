import { EventoOutboxProps, OutboxEvent } from '../../domain/outbox-event';
import { OutboxEventModel } from '../models/outbox-event.model';

export class OutboxEventMapper {
    static toModel(evento: OutboxEvent): OutboxEventModel {
        const modelo = new OutboxEventModel();
        modelo.id = evento.id;
        modelo.tipoEvento = evento.tipoEvento;
        modelo.idAgregado = evento.idAgregado;
        modelo.tipoAgregado = evento.tipoAgregado;
        modelo.payload = evento.payload;
        modelo.status = evento.status;
        modelo.quantidadeTentativas = evento.quantidadeTentativas;
        modelo.mensagemErro = evento.mensagemErro;
        modelo.criadoEm = evento.criadoEm;
        modelo.publicadoEm = evento.publicadoEm;
        return modelo;
    }

    static toDomain(modelo: OutboxEventModel): OutboxEvent {
        const props: EventoOutboxProps = {
            tipoEvento: modelo.tipoEvento,
            idAgregado: modelo.idAgregado,
            tipoAgregado: modelo.tipoAgregado,
            payload: modelo.payload,
            status: modelo.status,
            quantidadeTentativas: modelo.quantidadeTentativas,
            mensagemErro: modelo.mensagemErro,
            criadoEm: modelo.criadoEm,
            publicadoEm: modelo.publicadoEm,
        };

        return OutboxEvent.carregar(props, modelo.id);
    }
}
