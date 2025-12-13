import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { ServiceException } from 'src/common/exceptions/service.exception';

type ArquivoVerificado = {
    limpo: boolean;
    hash: string;
};

@Injectable()
export class VirusTotalService {
    private readonly apiKey: string | undefined;
    private readonly url: string;
    private readonly logger = new Logger(VirusTotalService.name);

    constructor() {
        this.apiKey = process.env.VIRUS_TOTAL_API_KEY;
        this.url = 'https://www.virustotal.com/api/v3/files';
    }

    async verificarVirus(
        file: Express.Multer.File,
    ): Promise<ArquivoVerificado> {
        const formData = new FormData();
        formData.append('file', file.buffer, file.originalname);

        const headers = {
            ...formData.getHeaders(),
            'x-apikey': this.apiKey,
        };

        try {
            const response = await axios.post(this.url, formData, { headers });
            if (response.status !== 200)
                throw new ServiceException(
                    'Erro ao enviar arquivo para análise',
                );

            const analiseResult = await axios.get(
                `https://www.virustotal.com/api/v3/analyses/${response.data.data.id}`,
                {
                    headers: {
                        accept: 'application/json',
                        'x-apikey': this.apiKey,
                    },
                },
            );
            if (analiseResult.status !== 200)
                throw new ServiceException(
                    'Erro ao obter resultado da análise',
                );

            const { attributes } = analiseResult.data.data;
            const { sha256 } = analiseResult.data.meta.file_info;

            const stats = attributes.stats;
            const infectado = stats.malicious > 0 || stats.suspicious > 0;

            if (infectado) {
                throw new ServiceException('Arquivo infectado detectado');
            }

            return { limpo: true, hash: sha256 };
        } catch (error) {
            if (error.status === 401) {
                this.logger.error(
                    'Erro de autenticação na API do VirusTotal:',
                    error,
                );
                throw new ServiceException(
                    'Erro de autenticação na API do VirusTotal',
                );
            }

            this.logger.error('Erro ao verificar o arquivo:', error);
            throw new ServiceException('Erro ao verificar o arquivo');
        }
    }
}
