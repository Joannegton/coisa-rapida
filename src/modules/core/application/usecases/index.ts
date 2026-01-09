import { SolicitarAluguelUseCase } from './solicitar-aluguel.usecase';
import { ConfirmarAluguelUseCase } from './confirmar-aluguel.usecase';
import { CancelarAluguelUseCase } from './cancelar-aluguel.usecase';
import { FinalizarAluguelUseCase } from './finalizar-aluguel.usecase';
import { ListarAlugueisUsuarioUseCase } from './listar-alugueis-usuario.usecase';

export const CoreUseCases = [
    SolicitarAluguelUseCase,
    ConfirmarAluguelUseCase,
    CancelarAluguelUseCase,
    FinalizarAluguelUseCase,
    ListarAlugueisUsuarioUseCase,
];
