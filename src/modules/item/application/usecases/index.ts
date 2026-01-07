import { CriarItemUseCase } from './criar-item.usecase';
import { AtualizarItemUseCase } from './atualizar-item.usecase';
import { AdicionarFotosItemUseCase } from './adicionar-fotos-item.usecase';
import { RemoverFotoItemUseCase } from './remover-foto-item.usecase';
import { AtualizarOrdemFotosItemUseCase } from './atualizar-ordem-fotos-item.usecase';

export const ItemUsecases = [
    CriarItemUseCase,
    AtualizarItemUseCase,
    AdicionarFotosItemUseCase,
    RemoverFotoItemUseCase,
    AtualizarOrdemFotosItemUseCase,
];
