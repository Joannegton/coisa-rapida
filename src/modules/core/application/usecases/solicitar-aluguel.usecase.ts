import { ForbiddenException, Inject } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { SolicitarAluguelDto } from '../dtos/solicitar-aluguel.dto';
import type { CoreUsuarioService } from '../../domain/services/usuario.service';
import { Aluguel } from '../../domain/aluguel';
import type { CoreItemService } from '../../domain/services/item.service';
import { AluguelDto } from '../dtos/results/Aluguel.dto';

type SolicitarAluguelUseCaseProps = SolicitarAluguelDto & {
    usuarioId: string;
};

export class SolicitarAluguelUseCase {
    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('UsuarioService')
        private readonly usuarioService: CoreUsuarioService,
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
    ) {}

    async execute(props: SolicitarAluguelUseCaseProps): Promise<AluguelDto> {
        const [locatario, item] = await Promise.all([
            this.usuarioService.buscar(props.usuarioId),
            this.itemService.buscar(props.itemId),
        ]);

        if (!locatario.verificado)
            throw new ForbiddenException('Usuário não verificado');

        const locador = await this.usuarioService.buscar(item.usuarioId);

        if (locatario.id === locador.id)
            throw new ForbiddenException(
                'Não é possível alugar seu próprio item.',
            );

        const aluguelDomain = Aluguel.criar({
            itemData: item,
            locadorData: locador,
            locatarioData: locatario,
            dataInicio: props.dataInicio,
            dataFim: props.dataFim,
            observacoesLocatario: props.observacoesLocatario,
        });

        const aluguelSalvo = await this.aluguelRepository.salvar(aluguelDomain);

        return aluguelSalvo.toDto();
    }
}
