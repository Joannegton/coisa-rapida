import { Inject } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelDto } from '../dtos/results/Aluguel.dto';

export class ListarAlugueisUsuarioUseCase {
    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
    ) {}

    async execute(usuarioId: string): Promise<AluguelDto[]> {
        const alugueis =
            await this.aluguelRepository.listarPorUsuario(usuarioId);

        return alugueis.map((aluguel) => aluguel.toDto());
    }
}
