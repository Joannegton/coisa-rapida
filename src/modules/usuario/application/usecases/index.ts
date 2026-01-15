import { EnviarCodigoSMSUseCase } from './verificacao/enviar-codigo-sms.usecase';
import { VerificarCodigoSMSUseCase } from './verificacao/verificar-codigo-sms.usecase';
import { EnviarLinkVerificacaoEmailUseCase } from './verificacao/enviar-link-verificacao-email.usecase';
import { VerificarLinkEmailUseCase } from './verificacao/verificar-link-email.usecase';
import { SalvarComprovanteResidenciaUseCase } from './verificacao/salvar-comprovante-residencia.usecase';
import { AdicionarEnderecoUsecase } from './usuario/adicionar-endereco.usecase';

export const usuarioUsecases = [
    EnviarCodigoSMSUseCase,
    VerificarCodigoSMSUseCase,
    EnviarLinkVerificacaoEmailUseCase,
    VerificarLinkEmailUseCase,
    SalvarComprovanteResidenciaUseCase,
    AdicionarEnderecoUsecase,
];
