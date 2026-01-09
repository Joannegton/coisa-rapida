import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreController } from './core.controller';
import { AluguelRepositoryImpl } from './infra/repositories/aluguel.repository';
import { CoreUsuarioServiceImpl } from './infra/services/usuario.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { CoreItemServiceImpl } from './infra/services/item.service';
import { ItemModule } from '../item/item.module';
import { CoreUseCases } from './application/usecases';
import { CoreMappers } from './infra/mappers';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AluguelModel } from './infra/models/aluguel.model';
import { CoreQueries } from './application/queries';
import { CoreEventHandlers } from './application/event-handlers';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([AluguelModel]),
        UsuarioModule,
        ItemModule,
    ],
    controllers: [CoreController],
    providers: [
        ...CoreUseCases,
        ...CoreMappers,
        ...CoreQueries,
        ...CoreEventHandlers,
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
    ],
    exports: [],
})
export class CoreModule {}
