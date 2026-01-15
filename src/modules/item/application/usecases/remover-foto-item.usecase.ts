import {
    Inject,
    ConflictException,
    NotFoundException,
    Injectable,
} from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import type { UploadImagemService } from '../../domain/services/upload-imagem.service';

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

        const fotoARemover = item.fotos.find((f) => f.id === props.fotoId);
        if (!fotoARemover) {
            throw new NotFoundException('Foto não encontrada neste item');
        }

        item.removerFoto(props.fotoId);

        if (fotoARemover.publicIdCloudinary) {
            this.uploadService
                .deletarImagem(fotoARemover.publicIdCloudinary)
                .catch((error) => {
                    console.error(
                        'Erro ao deletar Cloudinary (não crítico):',
                        error,
                    );
                });
        }

        await this.itemRepository.salvar(item);
    }
}
