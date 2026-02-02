import { Inject, NotFoundException } from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { BuscarItemDto } from '../dtos/buscar-item.dto';
import type { UsuarioService } from '../../domain/services/usuario.service';
import { ItemDto } from '../dtos/responses/item.dto';

export type BuscarItemQueryProps = BuscarItemDto & {
    itemId: string;
    usuarioId: string;
};

export class BuscarItemQuery {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
        @Inject('UsuarioService')
        private readonly usuarioService: UsuarioService,
    ) {}

    async execute(props: BuscarItemQueryProps): Promise<ItemDto> {
        if (!props.itemId || props.itemId.trim() === '')
            throw new InvalidPropsException('Item ID é obrigatório');

        if (!props.latitude || !props.longitude) {
            const usuario = await this.usuarioService.buscar(props.usuarioId);

            if (!usuario) throw new NotFoundException('Usuário não encontrado');

            props.latitude = usuario.endereco?.latitude;
            props.longitude = usuario.endereco?.longitude;
        }

        const item = await this.itemRepository.buscarComDistancia({
            itemId: props.itemId,
            latitude: props.latitude,
            longitude: props.longitude,
        });

        if (!item) {
            throw new NotFoundException('Item não encontrado');
        }

        item.adicionarProprietario(props.usuarioId);

        return item.toDto();
    }
}
