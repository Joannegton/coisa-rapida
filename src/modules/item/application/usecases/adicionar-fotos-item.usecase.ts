import {
    Inject,
    ConflictException,
    NotFoundException,
    Injectable,
} from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { Foto } from '../../domain/foto';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import type { UploadImagemService } from '../../domain/services/upload-imagem.service';
import { ItemFotoDto } from '../dtos/responses/item-foto.dto';

export type AdicionarFotosItemUseCaseProps = {
    itemId: string;
    usuarioId: string;
    fotos: Express.Multer.File[];
    fotoPrincipalId?: string;
};

@Injectable()
export class AdicionarFotosItemUseCase {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
        @Inject('UploadService')
        private readonly uploadService: UploadImagemService,
    ) {}

    async execute(props: AdicionarFotosItemUseCaseProps): Promise<ItemFotoDto> {
        const itemDomain = await this.itemRepository.buscar(props.itemId);
        if (!itemDomain) {
            throw new NotFoundException('Item não encontrado');
        }
        if (itemDomain.usuarioId !== props.usuarioId) {
            throw new ConflictException(
                'Você não tem permissão para adicionar fotos a este item',
            );
        }

        if (!props.fotos || props.fotos.length === 0) {
            throw new InvalidPropsException('Nenhuma foto foi enviada');
        }

        const totalAtual = itemDomain.fotos.length;
        if (totalAtual + props.fotos.length > 3) {
            throw new InvalidPropsException(
                `Total máximo 3 fotos. Atual: ${totalAtual}, tentando adicionar: ${props.fotos.length}`,
            );
        }

        const uploadResults = await Promise.all(
            props.fotos.map((file) =>
                this.uploadService.uploadImagem({
                    file,
                    usuarioId: props.usuarioId,
                }),
            ),
        );

        const fotosDomain = uploadResults.map((result, index) => {
            const nomeArquivo = result.publicId.split('/').pop();

            return Foto.criar({
                publicIdCloudinary: result.publicId,
                url: result.url,
                principal: false,
                nomeArquivo: nomeArquivo,
                tamanhoBytes: result.bytes,
                ordem: totalAtual + index + 1,
            });
        });

        itemDomain.adicionarFotos(fotosDomain);

        const itemSalvo = await this.itemRepository.salvar(itemDomain);

        const dto: ItemFotoDto = {
            itemId: itemDomain.id,
            fotos: itemSalvo.fotos.map((foto) => ({
                fotoId: foto.id,
                url: foto.url,
                ordem: foto.ordem,
                principal: foto.principal,
            })),
        };

        return dto;
    }
}
