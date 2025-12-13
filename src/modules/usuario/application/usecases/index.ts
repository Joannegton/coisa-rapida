import { EnviarCodigoSMSUseCase } from './verificacao/EnviarCodigoSMS.usecase';
import { VerificarCodigoSMSUseCase } from './verificacao/VerificarCodigoSMS.usecase';

export const usuarioUsecases = [
    EnviarCodigoSMSUseCase,
    VerificarCodigoSMSUseCase,
];
