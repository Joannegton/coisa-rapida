import { EnviarCodigoSMSUseCase } from './verificacao/enviar-codigo-sms.usecase';
import { SalvarComprovanteResidenciaUseCase } from './verificacao/salvar-comprovante-residencia.usecase';
import { VerificarCodigoSMSUseCase } from './verificacao/verificar-codigo-sms.usecase';

export const usuarioUsecases = [
    EnviarCodigoSMSUseCase,
    VerificarCodigoSMSUseCase,
    SalvarComprovanteResidenciaUseCase,
];
