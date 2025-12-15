import { randomUUID } from 'node:crypto';
import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from '../../../../shared/utils/domian.event';

export class EmailVerificadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EVENT_CONFIG.USUARIO.EMAIL_VERIFICADO;
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion = 1;

    constructor(
        public readonly usuarioId: string,
        public readonly email: string,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = usuarioId;
        this.occurredOn = new Date();
    }
}
