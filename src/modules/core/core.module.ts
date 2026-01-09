import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreController } from './core.controller';
import { AluguelRepositoryImpl } from './infra/repositories/aluguel.repository';
import { OutboxRepository } from './infra/repositories/outbox.repository';
import { TypeOrmUnitOfWork } from './infra/repositories/unit-of-work.impl';
import { CoreUsuarioServiceImpl } from './infra/services/usuario.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { CoreItemServiceImpl } from './infra/services/item.service';
import { ItemModule } from '../item/item.module';
import { SharedModule } from '../../shared/shared.module';
import { CoreUseCases } from './application/usecases';
import { CoreMappers } from './infra/mappers';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AluguelModel } from './infra/models/aluguel.model';
import { OutboxEventModel } from './infra/models/outbox-event.model';
import { CoreQueries } from './application/queries';
import { CoreEventHandlers } from './application/event-handlers';
import { OutboxPublisherListener } from './infra/jobs/outbox-publisher.listener';

@Module({
    imports: [
        CqrsModule,
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([AluguelModel, OutboxEventModel]),
        UsuarioModule,
        ItemModule,
        SharedModule,
    ],
    controllers: [CoreController],
    providers: [
        ...CoreUseCases,
        ...CoreMappers,
        ...CoreQueries,
        ...CoreEventHandlers,
        OutboxRepository,
        OutboxPublisherListener,
        {
            provide: 'AluguelRepository',
            useClass: AluguelRepositoryImpl,
        },
        {
            provide: 'UsuarioService',
            useClass: CoreUsuarioServiceImpl,
        },
        {
            provide: 'ItemService',
            useClass: CoreItemServiceImpl,
        },
        {
            provide: 'UnitOfWork',
            useClass: TypeOrmUnitOfWork,
        },
    ],
    exports: [],
})
export class CoreModule {}
