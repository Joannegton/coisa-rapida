import {
    Inject,
    ConflictException,
    NotFoundException,
    Injectable,
} from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { ItemFotoDto } from '../dtos/responses/item-foto.dto';

export type AtualizarOrdemFotosItemUseCaseProps = {
    itemId: string;
    usuarioId: string;
    ordem: Array<{ id: string; ordem: number }>;
    fotoPrincipalId?: string;
};

@Injectable()
export class AtualizarOrdemFotosItemUseCase {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
    ) {}

    async execute(
        props: AtualizarOrdemFotosItemUseCaseProps,
    ): Promise<ItemFotoDto> {
        const item = await this.itemRepository.buscar(props.itemId);
        if (!item) {
            throw new NotFoundException('Item não encontrado');
        }

        if (item.usuarioId !== props.usuarioId) {
            throw new ConflictException(
                'Você não tem permissão para atualizar fotos deste item',
            );
        }

        item.atualizarOrdemFotos(props.ordem);

        if (props.fotoPrincipalId) {
            item.mudarFotoPrincipal(props.fotoPrincipalId);
        }

        await this.itemRepository.salvar(item);

        const fotosDto: ItemFotoDto = {
            itemId: props.itemId,
            fotos: item.fotos.map((foto) => ({
                fotoId: foto.id,
                url: foto.url,
                ordem: foto.ordem,
                principal: foto.principal,
            })),
        };

        return fotosDto;
    }
}
