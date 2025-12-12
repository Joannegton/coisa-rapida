import { Injectable } from '@nestjs/common';
import {
    v2 as cloudinary,
    UploadApiErrorResponse,
    UploadApiResponse,
} from 'cloudinary';
import * as dotenv from 'dotenv';
import { VirusTotalService } from './VirusTotal.service';
import {
    ServicoExcecao,
    ResultadoUtil,
    ResultadoAssincrono,
    Resultado,
} from '../../../../../shared/utils/resultado';

dotenv.config();

@Injectable()
export class CloudinaryService {
    constructor(private readonly virusTotalService: VirusTotalService) {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
            secure: true,
        });
    }

    /**
     * Realiza o upload de um arquivo no Cloudinary.
     * Antes do upload, verifica se o arquivo está limpo de vírus e se atende ao tamanho máximo permitido.
     * @param file Arquivo recebido via Multer.
     * @returns Resultado do upload contendo os dados do arquivo no Cloudinary ou uma falha.
     */
    async uploadNoCloudinary(props: {
        file: Express.Multer.File;
        pasta: string;
        subPasta?: string;
    }): ResultadoAssincrono<UploadApiResponse, ServicoExcecao> {
        try {
            const tamanhoMaximo = 4 * 1024 * 1024; // 4MB
            if (props.file.size > tamanhoMaximo) {
                return ResultadoUtil.falha(
                    new ServicoExcecao('Tamanho máximo de 4MB'),
                );
            }

            const verificarVirus = await this.virusTotalService.verificarVirus(
                props.file,
            );
            if (verificarVirus.ehFalha()) {
                return ResultadoUtil.falha(verificarVirus.erro!);
            }

            if (!verificarVirus.valor?.limpo) {
                return ResultadoUtil.falha(
                    new ServicoExcecao('Arquivo infectado detectado'),
                );
            }

            const result = await new Promise<UploadApiResponse>(
                (resolve, reject) => {
                    const folderPath = props.subPasta
                        ? `coisaRapidaFiles/${props.pasta}/${props.subPasta}`
                        : `coisaRapidaFiles/${props.pasta}`;

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
                                if (error) return reject(error);
                                resolve(result);
                            },
                        )
                        .end(props.file.buffer);
                },
            );

            return ResultadoUtil.sucesso(result);
        } catch (error) {
            console.error('Erro ao fazer upload no Cloudinary:', error);
            return ResultadoUtil.falha(
                new ServicoExcecao(error?.message || 'Erro ao fazer upload'),
            );
        }
    }

    async deleteFileFromCloudinary(
        publicId: string,
    ): ResultadoAssincrono<string, ServicoExcecao> {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return ResultadoUtil.sucesso(result.result);
        } catch (error) {
            console.error('Erro ao deletar arquivo do Cloudinary:', error);
            return ResultadoUtil.falha(
                new ServicoExcecao(error?.message || 'Erro ao deletar arquivo'),
            );
        }
    }
}
