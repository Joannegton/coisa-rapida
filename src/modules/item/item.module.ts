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
import { BuscaGeograficaService } from './application/services/busca-geografica.service';
import { UploadImagemServiceImpl } from './infra/services/upload-imagem.service';
import { UsuarioServiceImpl } from './infra/services/usuario.service';
import { UsuarioModule } from '../usuario/usuario.module';
import { ModeracaoFilaService } from './infra/services/moderacao.fila.service';
import { VerificacaoVirusFilaService } from '../../shared/infra/services/verificacao-virus.fila.service';
import { AdvancedModerationWorker } from './infra/jobs/moderacao-avancada.processor.worker';
import { VerificacaoVirusProcessor } from '../../shared/infra/jobs/verificacao-virus.processor.worker';
import { ItemModeradoEventHandler } from './application/event-handlers/item-moderado.event-handler';
import { ItemMappers } from './infra/mappers';
import { SharedModule } from 'src/shared/shared.module';
import { ItemUsecases } from './application/usecases';

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
        ...ItemUsecases,
        ...ItemMappers,
        {
            provide: 'ItemRepository',
            useClass: ItemRepositoryImpl,
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
