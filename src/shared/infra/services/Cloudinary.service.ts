import { Injectable, Logger } from '@nestjs/common';
import {
    v2 as cloudinary,
    UploadApiErrorResponse,
    UploadApiResponse,
} from 'cloudinary';
import * as dotenv from 'dotenv';
import { VirusTotalService } from './VirusTotal.service';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { ServiceException } from 'src/common/exceptions/service.exception';

dotenv.config();

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    constructor(private readonly virusTotalService: VirusTotalService) {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
            secure: true,
        });
    }

    async uploadNoCloudinary(props: {
        file: Express.Multer.File;
        pasta: string;
        subPasta?: string;
    }): Promise<UploadApiResponse> {
        try {
            const tamanhoMaximo = 4 * 1024 * 1024; // 4MB
            if (props.file.size > tamanhoMaximo) {
                throw new InvalidPropsException('Tamanho máximo de 4MB');
            }

            const verificarVirus = await this.virusTotalService.verificarVirus(
                props.file,
            );

            if (!verificarVirus.limpo) {
                throw new ServiceException('Arquivo infectado por vírus');
            }

            const result = await new Promise<UploadApiResponse>(
                (resolve, reject) => {
                    const folderPath = props.subPasta
                        ? `coisaRapida/${props.pasta}/${props.subPasta}`
                        : `coisaRapida/${props.pasta}`;

                    cloudinary.uploader
                        .upload_stream(
                            {
                                resource_type: 'auto',
                                folder: folderPath,
                                public_id: props.file.originalname,
                                allowed_formats: ['jpg', 'png', 'pdf'],
                                transformation: [
                                    {
                                        width: 800,
                                        height: 800,
                                        crop: 'limit',
                                    },
                                ],
                            },
                            (
                                error: UploadApiErrorResponse,
                                result: UploadApiResponse,
                            ) => {
                                if (error)
                                    return reject(
                                        new Error(
                                            `Cloudinary upload failed: ${error.message || 'Unknown error'}`,
                                        ),
                                    );
                                resolve(result);
                            },
                        )
                        .end(props.file.buffer);
                },
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Erro ao fazer upload no Cloudinary: ${error.message}`,
                error.stack,
            );
            throw new ServiceException('Erro ao fazer upload');
        }
    }

    async deleteFileFromCloudinary(publicId: string): Promise<string> {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            this.logger.error('Erro ao deletar arquivo do Cloudinary:', error);
            throw new ServiceException('Erro ao deletar arquivo');
        }
    }
}
