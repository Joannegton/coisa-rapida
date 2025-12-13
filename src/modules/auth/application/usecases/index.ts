import { LoginUsecase } from './login.usecase';
import { RefreshTokenUsecase } from './refresh-token.usecase';
import { RegistrarUsecase } from './registrar.usecase';
import { ResetarSenhaUsecase } from './resetar-senha.usecase';
import { RevogarTokenUsecase } from './revogar-token.usecase';
import { SolicitarRecuperacaoSenhaUsecase } from './solicitar-recuperacao-senha.usecase';
import { ValidarCodigoRecuperacaoUsecase } from './validar-codigo-recuperacao.usecase';

export const AUTH_USECASES = [
    LoginUsecase,
    RefreshTokenUsecase,
    RegistrarUsecase,
    ResetarSenhaUsecase,
    RevogarTokenUsecase,
    SolicitarRecuperacaoSenhaUsecase,
    ValidarCodigoRecuperacaoUsecase,
];
