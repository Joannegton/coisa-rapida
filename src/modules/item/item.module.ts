import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bull';
import { ItemController } from './item.controller';
import { ItemModel } from './infra/models/item.model';
import { FotosItemModel } from './infra/models/fotos-item.model';
import { ModeracaoItemModel } from './infra/models/moderacao-item.model';
import { DisponibilidadeItemModel } from './infra/models/disponibilidade-item.model';
import { ItemRepositoryImpl } from './infra/repositories/item.repository';
import { FotoRepositoryImpl } from './infra/repositories/foto.repository';
import { BuscaGeograficaService } from './application/services/busca-geografica.service';
import { UploadImagemServiceImpl } from './infra/services/upload-imagem.service';
import { UsuarioServiceImpl } from './infra/services/usuario.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { ModeracaoFilaService } from './infra/services/moderacao.fila.service';
import { AdvancedModerationWorker } from './infra/jobs/moderacao-avancada.processor.worker';
import { ItemModeradoEventHandler } from './application/event-handlers/item-moderado.event-handler';
import { ItemMappers } from './infra/mappers';
import { SharedModule } from 'src/shared/shared.module';
import { ItemUsecases } from './application/usecases';
import { ItemQueries } from './application/queries';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ItemModel,
            FotosItemModel,
            ModeracaoItemModel,
            DisponibilidadeItemModel,
        ]),
        UsuarioModule,
        CqrsModule,
        SharedModule,
        BullModule.registerQueue({
            name: 'moderacao',
        }),
        BullModule.registerQueue({
            name: 'verificacao-avancada',
        }),
    ],
    controllers: [ItemController],
    providers: [
        ...ItemQueries,
        ...ItemUsecases,
        ...ItemMappers,
        {
            provide: 'ItemRepository',
            useClass: ItemRepositoryImpl,
        },
        {
            provide: 'FotoRepository',
            useClass: FotoRepositoryImpl,
        },
        {
            provide: 'UsuarioService',
            useClass: UsuarioServiceImpl,
        },
        {
            provide: 'UploadService',
            useClass: UploadImagemServiceImpl,
        },
        ModeracaoFilaService,
        AdvancedModerationWorker,
        ItemModeradoEventHandler,
        BuscaGeograficaService,
    ],
    exports: [],
})
export class ItemModule {}
