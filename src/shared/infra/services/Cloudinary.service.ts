import { Injectable, Logger } from '@nestjs/common';
import {
    v2 as cloudinary,
    UploadApiErrorResponse,
    UploadApiResponse,
} from 'cloudinary';
import * as dotenv from 'dotenv';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import { ServiceException } from 'src/common/exceptions/service.exception';
import { VerificacaoVirusFilaService } from 'src/shared/infra/services/verificacao-virus.fila.service';
import { VirusTotalService } from './VirusTotal.service';

dotenv.config();

export enum TipoUploadCloudinary {
    ITEM_FOTO = 'item_foto',
    COMPROVANTE_RESIDENCIA = 'comprovante_residencia',
    USUARIO_FOTO = 'usuario_foto',
}

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);
    constructor(
        private readonly verificacaoVirusFilaService: VerificacaoVirusFilaService,
        private readonly virusTotalService: VirusTotalService,
    ) {
        cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
            secure: true,
        });
    }

    async uploadNoCloudinary(props: {
        usuarioId: string;
        file: Express.Multer.File;
        pasta: string;
        subPasta?: string;
        tipoUpload: TipoUploadCloudinary;
    }): Promise<UploadApiResponse> {
        try {
            const tamanhoMaximo = 10 * 1024 * 1024; // 10MB para imagens otimizadas

            if (props.file.size > tamanhoMaximo) {
                throw new InvalidPropsException(
                    `Tamanho máximo de ${tamanhoMaximo / (1024 * 1024)}MB por arquivo`,
                );
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
                                allowed_formats: ['jpg', 'png', 'webp', 'pdf'],
                                transformation: [
                                    {
                                        width: 1200,
                                        height: 1200,
                                        crop: 'limit',
                                        quality: 'auto:best',
                                        format: 'auto',
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

            // // Fire-and-forget: execute envio ao VirusTotal em background com retries.
            // // Garantir que nunca se agende uma verificação sem o idAnaliseVirusTotal.
            void (async () => {
                const maxAttempts = 5;
                let attempt = 0;
                let idAnaliseVirusTotal: string | null = null;

                const sleep = (ms: number) =>
                    new Promise((res) => setTimeout(res, ms));

                while (attempt < maxAttempts && !idAnaliseVirusTotal) {
                    attempt += 1;
                    try {
                        this.logger.debug(
                            `🔁 Tentativa ${attempt} de enviar arquivo ao VirusTotal: ${props.file.originalname}`,
                        );
                        idAnaliseVirusTotal =
                            await this.virusTotalService.enviarArquivo(
                                props.file,
                            );
                        if (idAnaliseVirusTotal) {
                            await this.verificacaoVirusFilaService.agendarVerificacao(
                                {
                                    publicId: result.public_id,
                                    idAnaliseVirusTotal,
                                    usuarioId: props.usuarioId,
                                    tipoUpload: props.tipoUpload,
                                },
                            );
                            this.logger.debug(
                                `✅ Verificação de vírus agendada para: ${props.file.originalname} (ID: ${idAnaliseVirusTotal})`,
                            );
                            break;
                        }
                    } catch (err) {
                        const waitMs = 2000 * Math.pow(2, attempt - 1); // 2s,4s,8s...
                        this.logger.warn(
                            `⚠️ Falha ao enviar para VirusTotal (attempt=${attempt}): ${err.message} — aguardando ${waitMs}ms antes de tentar novamente`,
                        );
                        // aguarda antes de nova tentativa
                        // se for a última tentativa, não agendamos sem id
                        if (attempt < maxAttempts) await sleep(waitMs);
                    }
                }

                if (!idAnaliseVirusTotal) {
                    this.logger.error(
                        `🚨 Não foi possível obter idAnaliseVirusTotal após ${maxAttempts} tentativas para arquivo: ${props.file.originalname}. NÃO será agendada verificação sem id. publicId=${result.public_id}`,
                    );
                    // TODO: Para maior resiliência, persistir um registro no DB ou enfileirar um job
                    // que fará o envio ao VirusTotal a partir do publicId (worker fará download do Cloudinary).
                }
            })();

            return result;
        } catch (error) {
            this.logger.error(
                `Erro ao fazer upload no Cloudinary: ${error.message}`,
                error.stack,
            );
            throw new ServiceException('Erro ao fazer upload');
        }
    }

    async deletarArquivoCloudinary(publicId: string): Promise<any> {
        try {
            const result = await cloudinary.uploader.destroy(publicId, {
                invalidate: true,
            });

            if (
                result?.result &&
                result.result !== 'ok' &&
                result.result !== 'not found'
            ) {
                this.logger.error(
                    `Erro ao deletar arquivo do Cloudinary. publicId=${publicId} result=${result.result}`,
                );
            }

            return result;
        } catch (error) {
            this.logger.error('Erro ao deletar arquivo do Cloudinary:', error);
            throw new ServiceException('Erro ao deletar arquivo');
        }
    }
}
