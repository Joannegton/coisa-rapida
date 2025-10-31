import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './infra/services/Cloudinary.service';
import { VirusTotalService } from './infra/services/VirusTotal.service';
import { UsuarioFirestoreService } from './infra/services/UsuarioFirestore.service';
import { NotificacaoService } from './infra/services/Notificacao.service';
import { TwilioService } from './infra/services/Twilio.service';
import { VerificacaoResidenciaRepository } from './infra/repositories/VerificacaoResidencia.repository';
import { NotificacaoRepository } from './infra/repositories/Notificacao.repository';
import { SalvarComprovanteResidenciaUseCase } from './application/usecases/SalvarComprovanteResidencia.usecase';
import { ListarVerificacoesPendentesUseCase } from './application/queries/ListarVerificacoesPendentes.usecase';
import { EnviarCodigoSMSUseCase } from './application/usecases/EnviarCodigoSMS.usecase';
import { VerificarCodigoSMSUseCase } from './application/usecases/VerificarCodigoSMS.usecase';
import { VerificacaoResidenciaModel } from './infra/models/VerificacaoResidencia.model';
import { Notificacao } from './infra/models/Notificacao.model';
import { UsuarioModel } from './infra/models/Usuario.model';
import { EnderecoModel } from './infra/models/Endereco.model';
import { FirebaseAuthStrategy } from './infra/auth/FirebaseAuth.strategy';
import { FirebaseModule } from '../../config/firebase.module';
import { SegurancaController } from './seguranca.controller';
import { ProcessarStatusComprovanteResidenciaUseCase } from './application/usecases/ProcessarStatusComprovanteResidencia.usecase';
import { BuscarVerificacaoPorIdQuery } from './application/queries/BuscarVerificacaoId.query';
import { SalvarImagensUseCase } from './application/usecases/SalvarImagensItem.usecase';
import { ImagemController } from './Imagem.controller';
import { CriarCheckoutUsecase } from './application/usecases/CriarPreferenciaPagamento.usecase';
import { ObterStatusPagamentoUsecase } from './application/usecases/ObterStatusPagamento.usecase';
import { ProcessarWebhookUsecase } from './application/usecases/ProcessarWebhook.usecase';
import { MercadoPagoService } from './infra/services/mercado-pago.service';
import { PagamentoController } from './Pagamento.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerificacaoResidenciaModel, 
      Notificacao, 
      UsuarioModel, 
      EnderecoModel,
    ]),
    PassportModule.register({ defaultStrategy: 'firebase' }),
    FirebaseModule,
    ConfigModule, //ver se realmente é necessario
  ],
  controllers: [SegurancaController, ImagemController, PagamentoController],
  providers: [
    CloudinaryService,
    VirusTotalService,
    TwilioService,
    UsuarioFirestoreService,
    NotificacaoService,
    MercadoPagoService,
    FirebaseAuthStrategy,
    VerificacaoResidenciaRepository,
    NotificacaoRepository,
    SalvarComprovanteResidenciaUseCase,
    ListarVerificacoesPendentesUseCase,
    ProcessarStatusComprovanteResidenciaUseCase,
    BuscarVerificacaoPorIdQuery,
    EnviarCodigoSMSUseCase,
    VerificarCodigoSMSUseCase,
    SalvarImagensUseCase,
    CriarCheckoutUsecase,
    ObterStatusPagamentoUsecase,
    ProcessarWebhookUsecase,
  ],
  exports: [
    SalvarComprovanteResidenciaUseCase,
    ListarVerificacoesPendentesUseCase,
    CloudinaryService,
    UsuarioFirestoreService,
    TwilioService,
    EnviarCodigoSMSUseCase,
    VerificarCodigoSMSUseCase,
  ],
})
export class SegurancaModule {}
