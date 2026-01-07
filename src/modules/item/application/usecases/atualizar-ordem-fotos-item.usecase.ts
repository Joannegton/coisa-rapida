import {
    Inject,
    ConflictException,
    NotFoundException,
    Injectable,
} from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import type { FotoRepository } from '../../domain/repositories/foto.repository';
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
        @Inject('FotoRepository')
        private readonly fotoRepository: FotoRepository,
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

        const idsOrdenacao = props.ordem.map((o) => o.id);
        for (const id of idsOrdenacao) {
            const fotoExiste = item.fotos.find((f) => f.id === id);
            if (!fotoExiste) {
                throw new NotFoundException(
                    `Foto ${id} não encontrada neste item`,
                );
            }
        }

        // validar que a ordem é sequencial 1-N sem gaps
        const ordensRecebidas = props.ordem
            .map((o) => o.ordem)
            .sort((a, b) => a - b);
        for (let i = 0; i < ordensRecebidas.length; i++) {
            if (ordensRecebidas[i] !== i + 1) {
                throw new InvalidPropsException(
                    'Ordem deve ser sequencial sem gaps (1, 2, 3...)',
                );
            }
        }

        if (props.fotoPrincipalId) {
            const fotoPrincipal = item.fotos.find(
                (f) => f.id === props.fotoPrincipalId,
            );
            if (!fotoPrincipal) {
                throw new NotFoundException(
                    'Foto principal informada não encontrada neste item',
                );
            }
        }

        await this.fotoRepository.atualizarOrdem(props.ordem);

        if (props.fotoPrincipalId) {
            await this.fotoRepository.tornarPrincipal(
                props.fotoPrincipalId,
                props.itemId,
            );
        }

        // 7. Incrementar versão do item
        await this.itemRepository.incrementarVersao(props.itemId);

        const fotosAtualizadas = await this.fotoRepository.listarPorItem(
            props.itemId,
        );

        const fotosDto: ItemFotoDto = {
            itemId: props.itemId,
            fotos: fotosAtualizadas.map((foto) => ({
                url: foto.url,
                ordem: foto.ordem,
                principal: foto.principal,
                fotoId: foto.id,
            })),
        };

        return fotosDto;
    }
}
