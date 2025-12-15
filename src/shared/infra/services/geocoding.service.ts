import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ServiceException } from 'src/common/exceptions/service.exception';

export interface GeocodingResult {
    latitude: number;
    longitude: number;
    enderecoFormatado?: string;
}

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);
    private readonly GOOGLE_MAPS_URL =
        'https://maps.googleapis.com/maps/api/geocode/json';
    private readonly API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    private readonly USER_AGENT = 'CoisaRapida/1.0';

    constructor() {
        if (!this.API_KEY) {
            throw new Error('GOOGLE_MAPS_API_KEY não configurada no ambiente');
        }
    }

    /**
     * Geocodifica um endereço brasileiro usando o Google Maps Geocoding API
     * @param endereco Objeto com os dados do endereço
     * @returns Coordenadas de latitude e longitude
     */
    async geocodificar(endereco: {
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        pais?: string;
    }): Promise<GeocodingResult> {
        try {
            const enderecoCompleto = this.formatarEndereco(endereco);

            const response = await axios.get(this.GOOGLE_MAPS_URL, {
                params: {
                    address: enderecoCompleto,
                    components: 'country:BR',
                    key: this.API_KEY,
                },
                headers: {
                    'User-Agent': this.USER_AGENT,
                },
                timeout: 5000,
            });

            if (
                response.data?.status !== 'OK' ||
                !response.data.results ||
                response.data.results.length === 0
            ) {
                this.logger.warn(
                    `Endereço não encontrado: ${enderecoCompleto}. Status: ${response.data?.status}`,
                );
                throw new ServiceException(
                    'Não foi possível geocodificar o endereço fornecido',
                );
            }

            const resultado = response.data.results[0];
            const location = resultado.geometry.location;

            const geocodingResult: GeocodingResult = {
                latitude: location.lat,
                longitude: location.lng,
                enderecoFormatado: resultado.formatted_address,
            };

            this.logger.log(
                `Endereço geocodificado: ${enderecoCompleto} -> (${geocodingResult.latitude}, ${geocodingResult.longitude})`,
            );

            return geocodingResult;
        } catch (error) {
            if (error instanceof ServiceException) {
                throw error;
            }

            this.logger.error(
                `Erro ao geocodificar endereço: ${error.message}`,
                error.stack,
            );

            throw new ServiceException(
                'Erro ao processar o endereço. Verifique os dados informados.',
            );
        }
    }

    /**
     * Geocodifica usando apenas o CEP (fallback mais rápido)
     * @param cep CEP no formato 00000-000
     * @returns Coordenadas aproximadas do CEP
     */
    async geocodificarPorCep(cep: string): Promise<GeocodingResult> {
        try {
            const cepLimpo = cep.replaceAll(/\D/g, '');

            const response = await axios.get(this.GOOGLE_MAPS_URL, {
                params: {
                    components: `postal_code:${cepLimpo}|country:BR`,
                    key: this.API_KEY,
                },
                headers: {
                    'User-Agent': this.USER_AGENT,
                },
                timeout: 5000,
            });

            if (
                response.data?.status !== 'OK' ||
                !response.data.results ||
                response.data.results.length === 0
            ) {
                this.logger.warn(
                    `CEP não encontrado: ${cep}. Status: ${response.data?.status}`,
                );
                throw new ServiceException('CEP não encontrado');
            }

            const resultado = response.data.results[0];
            const location = resultado.geometry.location;

            return {
                latitude: location.lat,
                longitude: location.lng,
                enderecoFormatado: resultado.formatted_address,
            };
        } catch (error) {
            if (error instanceof ServiceException) {
                throw error;
            }

            this.logger.error(
                `Erro ao geocodificar CEP: ${error.message}`,
                error.stack,
            );

            throw new ServiceException(
                'Erro ao processar o CEP. Verifique se está correto.',
            );
        }
    }

    /**
     * Formata o endereço brasileiro para busca no Google Maps
     */
    private formatarEndereco(endereco: {
        rua: string;
        numero: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        pais?: string;
    }): string {
        const partes = [
            `${endereco.rua}, ${endereco.numero}`,
            endereco.bairro,
            endereco.cidade,
            endereco.estado,
            endereco.pais || 'Brasil',
            endereco.cep,
        ];

        return partes.filter(Boolean).join(', ');
    }
}
