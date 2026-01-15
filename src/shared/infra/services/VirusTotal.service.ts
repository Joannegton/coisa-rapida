import { Injectable } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import { ServiceException } from 'src/common/exceptions/service.exception';

interface EstatisticasVirusTotal {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
}

interface ResultadoAnalise {
    data: {
        attributes: {
            status: string;
            stats?: EstatisticasVirusTotal;
            last_analysis_stats?: EstatisticasVirusTotal;
        };
    };
}

interface ArquivoVerificado {
    limpo: boolean;
    hash: string;
}

// verificar se poder dar throw error, se é usado na fila

@Injectable()
export class VirusTotalService {
    private readonly chaveApi: string;
    private readonly urlBase: string = 'https://www.virustotal.com/api/v3';
    private readonly TIMEOUT_REQUISICAO_MS = 30000;

    constructor() {
        const chaveApi = process.env.VIRUS_TOTAL_API_KEY;
        if (!chaveApi) {
            throw new Error(
                'VIRUS_TOTAL_API_KEY não está definida no ambiente',
            );
        }
        this.chaveApi = chaveApi;
    }

    async enviarArquivo(arquivo: Express.Multer.File): Promise<string> {
        const formData = new FormData();
        formData.append('file', arquivo.buffer, arquivo.originalname);

        const cabecalhos = {
            ...formData.getHeaders(),
            'x-apikey': this.chaveApi,
        };

        const resposta = await axios.post(`${this.urlBase}/files`, formData, {
            headers: cabecalhos,
            timeout: this.TIMEOUT_REQUISICAO_MS * 2, // Dobro do timeout para upload
        });

        if (
            (resposta.status !== 200 && resposta.status !== 201) ||
            !resposta.data?.data?.id
        ) {
            throw new ServiceException('Erro ao enviar arquivo para análise');
        }

        return resposta.data.data.id;
    }

    async consultarAnalise(idAnalise: string): Promise<{
        status: string;
        infectado: boolean;
        estatisticas?: EstatisticasVirusTotal;
    }> {
        const cabecalhos = this.obterCabecalhos();

        try {
            const resposta = await axios.get<ResultadoAnalise>(
                `${this.urlBase}/analyses/${idAnalise}`,
                {
                    headers: cabecalhos,
                    timeout: this.TIMEOUT_REQUISICAO_MS,
                },
            );

            if (resposta.status === 200 && resposta.data?.data?.attributes) {
                const { status, stats, last_analysis_stats } =
                    resposta.data.data.attributes;
                const estatisticas = stats || last_analysis_stats;

                return {
                    status,
                    infectado: this.estaInfectado(estatisticas),
                    estatisticas,
                };
            }

            throw new ServiceException('Resposta inválida do VirusTotal');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new ServiceException('Análise não encontrada');
            }

            if (axios.isAxiosError(error)) {
                const mensagem =
                    error.response?.data?.error?.message ||
                    'Erro na comunicação com VirusTotal';
                throw new ServiceException(mensagem);
            }

            throw error;
        }
    }

    private obterCabecalhos(): { [key: string]: string } {
        return {
            'x-apikey': this.chaveApi,
            accept: 'application/json',
        };
    }

    private estaInfectado(estatisticas?: EstatisticasVirusTotal): boolean {
        if (!estatisticas) {
            return false;
        }
        return estatisticas.malicious > 0 || estatisticas.suspicious > 0;
    }
}
