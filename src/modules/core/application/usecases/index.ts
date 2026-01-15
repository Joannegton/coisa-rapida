import { SolicitarAluguelUseCase } from './solicitar-aluguel.usecase';
import { ConfirmarAluguelUseCase } from './confirmar-aluguel.usecase';
import { CancelarAluguelUseCase } from './cancelar-aluguel.usecase';
import { RecusarAluguelUseCase } from './recusar-aluguel.usecase';
import { FinalizarAluguelUseCase } from './finalizar-aluguel.usecase';
import { AssinarContratoUsecase } from './assinar-contrato.usecase';

export const CoreUseCases = [
    SolicitarAluguelUseCase,
    ConfirmarAluguelUseCase,
    CancelarAluguelUseCase,
    RecusarAluguelUseCase,
    FinalizarAluguelUseCase,
    AssinarContratoUsecase,
];
