import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
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
import { AssinaturaServiceImpl } from './infra/services/assinatura.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([AluguelModel, OutboxEventModel]),
        JwtModule.register({
            secret: process.env.JWT_CONTRATOS_SECRET,
            signOptions: {
                issuer: 'coisa-rapida-contratos',
                algorithm: 'HS256',
            },
        }),
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
        {
            provide: 'AssinaturaService',
            useFactory: (jwtService: JwtService) => {
                return new AssinaturaServiceImpl(jwtService);
            },
            inject: [JwtService],
        },
    ],
    exports: [],
})
export class CoreModule {}
