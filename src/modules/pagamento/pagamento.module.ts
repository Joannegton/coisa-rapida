import { Module } from '@nestjs/common';
import { PagamentoController } from './pagamento.controller';
import { PagamentoUsecases } from './application/usecases';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagamentoModel } from './infra/models/pagamento.model';
import { TransferenciaModel } from './infra/models/transferencia.model';
import { PagamentoRepositoryImpl } from './infra/repositories/pagamento.repository';
import { MercadoPagoServiceImpl } from './infra/services/mercado-pago.service';
import { TransferenciaRepositoryImpl } from './infra/repositories/transferencia.repository';
import { PagamentoMappers } from './infra/mappers';
import { AluguelServiceImpl } from './infra/services/aluguel.service';
import { CoreModule } from '../core/core.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PagamentoModel, TransferenciaModel]),
        CoreModule,
    ],
    providers: [
        ...PagamentoUsecases,
        ...PagamentoMappers,
        {
            provide: 'PagamentoRepository',
            useClass: PagamentoRepositoryImpl,
        },
        {
            provide: 'TransferenciaRepository',
            useClass: TransferenciaRepositoryImpl,
        },
        {
            provide: 'MercadoPagoService',
            useClass: MercadoPagoServiceImpl,
        },
        {
            provide: 'AluguelService',
            useClass: AluguelServiceImpl,
        },
    ],
    controllers: [PagamentoController],
})
export class PagamentoModule {}
