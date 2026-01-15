import { ForbiddenException, Inject } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelDto } from '../dtos/results/Aluguel.dto';
import { AluguelException } from '../../domain/exceptions/aluguel.exception';

type BuscarAluguelIdQueryProps = {
    id: string;
    usuarioId: string;
};

export class BuscarAluguelIdQuery {
    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
    ) {}

    async execute(props: BuscarAluguelIdQueryProps): Promise<AluguelDto> {
        const aluguel = await this.aluguelRepository.buscar(props.id);

        if (!aluguel) {
            throw new AluguelException('Aluguel não encontrado.');
        }

        if (
            aluguel?.locador.id !== props.usuarioId &&
            aluguel?.locatario.id !== props.usuarioId
        ) {
            throw new ForbiddenException(
                'Você não tem permissão para acessar este aluguel.',
            );
        }

        return aluguel.toDto();
    }
}
