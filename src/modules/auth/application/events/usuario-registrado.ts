import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from '../../../../shared/utils/domian.event';
import { randomUUID } from 'node:crypto';

export class UsuarioRegistradoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EVENT_CONFIG.USUARIO.REGISTRADO;
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion = 1;

    constructor(
        public readonly usuarioId: string,
        public readonly email: string,
        public readonly nome: string,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = usuarioId;
        this.occurredOn = new Date();
    }
}
