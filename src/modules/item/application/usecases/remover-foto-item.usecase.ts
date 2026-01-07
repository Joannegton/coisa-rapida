import {
    Inject,
    ConflictException,
    NotFoundException,
    Injectable,
} from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import type { UploadImagemService } from '../../domain/services/upload-imagem.service';
import type { FotoRepository } from '../../domain/repositories/foto.repository';

export type RemoverFotoItemUseCaseProps = {
    itemId: string;
    fotoId: string;
    usuarioId: string;
};

@Injectable()
export class RemoverFotoItemUseCase {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
        @Inject('FotoRepository')
        private readonly fotoRepository: FotoRepository,
        @Inject('UploadService')
        private readonly uploadService: UploadImagemService,
    ) {}

    async execute(props: RemoverFotoItemUseCaseProps): Promise<void> {
        const item = await this.itemRepository.buscar(props.itemId);
        if (!item) {
            throw new NotFoundException('Item não encontrado');
        }
        if (item.usuarioId !== props.usuarioId) {
            throw new ConflictException(
                'Você não tem permissão para remover fotos deste item',
            );
        }

        const foto = item.fotos.find((f) => f.id === props.fotoId);
        if (!foto) {
            throw new NotFoundException('Foto não encontrada neste item');
        }

        // não pode remover última foto
        if (item.fotos.length < 2) {
            throw new InvalidPropsException(
                'Item deve ter pelo menos 1 foto. Não é possível remover a última.',
            );
        }

        this.uploadService.deletarImagem(props.fotoId).catch((error) => {
            console.error('Erro ao deletar Cloudinary (não crítico):', error);
        });

        await this.fotoRepository.remover(props.fotoId);

        await this.fotoRepository.recalcularOrdem(props.itemId);

        const eraPrincipal = foto.principal;
        if (eraPrincipal) {
            const primeiraMantida = item.fotos
                .filter((f) => f.id !== props.fotoId)
                .sort((a, b) => a.ordem - b.ordem)[0];

            if (primeiraMantida) {
                await this.fotoRepository.tornarPrincipal(
                    primeiraMantida.id,
                    props.itemId,
                );
            }
        }

        // 8. Incrementar versão do item
        await this.itemRepository.incrementarVersao(props.itemId);
    }
}
