import { Inject, NotFoundException } from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { ItemComDistanciaDto } from '../dtos/responses/item-distancia.dto';
import { Utils } from 'src/shared/utils';
import { BuscarItemDto } from '../dtos/buscar-item.dto';

export type BuscarItemQueryProps = BuscarItemDto & {
    itemId: string;
    usuarioId: string;
};

export class BuscarItemQuery {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
    ) {}

    async execute(props: BuscarItemQueryProps): Promise<ItemComDistanciaDto> {
        if (!props.itemId || props.itemId.trim() === '')
            throw new InvalidPropsException('Item ID é obrigatório');

        const resultado = await this.itemRepository.buscarComDistancia({
            itemId: props.itemId,
            latitude: props.usuarioLatitude,
            longitude: props.usuarioLongitude,
        });

        if (!resultado) {
            throw new NotFoundException('Item não encontrado');
        }

        const { item, distanciaMetros } = resultado;

        if (item.usuarioId === props.usuarioId) {
            return {
                item: item.toDto(),
                distanciaMetros: null,
                distanciaFormatada: null,
                proprietario: true,
            };
        }

        return {
            item: item.toDto(),
            distanciaMetros,
            distanciaFormatada: Utils.formatarDistancia(distanciaMetros!),
        };
    }
}
