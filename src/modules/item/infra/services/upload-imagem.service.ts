import {
    CloudinaryService,
    TipoUploadCloudinary,
} from 'src/shared/infra/services/Cloudinary.service';
import {
    UploadImagemProps,
    UploadImagemResult,
    UploadImagemService,
} from '../../domain/services/upload-imagem.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadImagemServiceImpl implements UploadImagemService {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    async uploadImagem(props: UploadImagemProps): Promise<UploadImagemResult> {
        const uploadResult = await this.cloudinaryService.uploadNoCloudinary({
            file: props.file,
            pasta: `itens`,
            subPasta: `${props.usuarioId}`,
            usuarioId: props.usuarioId,
            tipoUpload: TipoUploadCloudinary.ITEM_FOTO,
        });

        return {
            bytes: uploadResult.bytes,
            format: uploadResult.format,
            original_filename: uploadResult.original_filename,
            publicId: uploadResult.publicId,
            resource_type: uploadResult.resource_type,
            secure_url: uploadResult.secure_url,
            type: uploadResult.type,
            url: uploadResult.url,
        };
    }
}
