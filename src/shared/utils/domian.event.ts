import { IEvent } from '@nestjs/cqrs';

export interface DomainEvent extends IEvent {
    readonly eventId: string;
    readonly eventType: string;
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number;
}
