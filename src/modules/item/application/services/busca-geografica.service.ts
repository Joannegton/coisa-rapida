import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ItemDto } from '../dtos/responses/item.dto';
import { CategoriaItem, EstadoItem } from '../../infra/models/item.model';
import type { ItemRepository } from '../../domain/repositories/item.repository';

export type ItemComDistanciaProps = {
    item: ItemDto;
    distanciaMetros: number;
    distanciaFormatada?: string;
};

export type BuscarMaisProximosDTO = {
    latitude: number;
    longitude: number;
    limite?: number;
    offset?: number;
};

export type BuscarPorProximidadeDTO = {
    latitude: number;
    longitude: number;
    raioMetros?: number;
    categorias?: CategoriaItem[];
    precoMaximoPorDia?: number;
    estadoMinimo?: EstadoItem;
    ordenarPor?: OrdenacaoBuscaGeografica;
    limite?: number;
    offset?: number;
};

export enum OrdenacaoBuscaGeografica {
    DISTANCIA = 'distancia',
    PRECO = 'preco',
    POPULARIDADE = 'popularidade',
}

@Injectable()
export class BuscaGeograficaService {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
    ) {}

    /**
     * Busca itens dentro de um raio específico a partir de coordenadas.
     * Utiliza índice GiST do PostGIS para performance otimizada.
     *
     * Regra de negócio:
     * - Apenas itens com status ATIVO são retornados
     * - Distância calculada em linha reta (great circle distance)
     * - Resultados podem ser filtrados por categoria, preço e estado
     * - Ordenação por distância, preço ou popularidade
     */
    async buscarPorProximidade(
        props: BuscarPorProximidadeDTO,
    ): Promise<ItemComDistanciaProps[]> {
        const resultados = await this.itemRepository.buscarPorProximidade({
            latitude: props.latitude,
            longitude: props.longitude,
            raioMetros: props.raioMetros ?? 5000,
            categorias: props.categorias,
            precoMaximoPorDia: props.precoMaximoPorDia,
            estadoMinimo: props.estadoMinimo,
            ordenarPor: props.ordenarPor,
            limite: props.limite ?? 20,
            offset: props.offset ?? 0,
        });

        return resultados.map((resultado) => ({
            item: resultado.item.toDto(),
            distanciaMetros: resultado.distanciaMetros,
            distanciaFormatada: this.formatarDistancia(
                resultado.distanciaMetros,
            ),
        }));
    }

    /**
     * Busca os N itens mais próximos de um ponto (sem limite de raio).
     * Útil para "Itens perto de você" ou "Recomendações por proximidade".
     *
     * Regra de negócio:
     * - Apenas itens ATIVO
     * - Ordenação sempre por distância crescente
     * - Limite padrão de 10 itens
     *
     * @param dto - Coordenadas e limite
     * @returns Lista de itens mais próximos
     */
    async buscarMaisProximos(
        dto: BuscarMaisProximosDTO,
    ): Promise<ItemComDistanciaProps[]> {
        const resultados = await this.itemRepository.buscarMaisProximos(
            dto.latitude,
            dto.longitude,
            dto.limite ?? 10,
            dto.offset ?? 0,
        );

        return resultados.map((resultado) => ({
            item: resultado.item.toDto(),
            distanciaMetros: resultado.distanciaMetros,
            distanciaFormatada: this.formatarDistancia(
                resultado.distanciaMetros,
            ),
        }));
    }

    /**
     * Calcula a distância entre um item específico e um ponto geográfico.
     *
     * @param itemId - ID do item
     * @param latitude - Latitude do ponto de referência
     * @param longitude - Longitude do ponto de referência
     * @returns Distância em metros e formatada
     */
    async calcularDistanciaParaItem(
        itemId: string,
        latitude: number,
        longitude: number,
    ): Promise<{ distanciaMetros: number; distanciaFormatada: string }> {
        const distancia = await this.itemRepository.calcularDistancia(
            itemId,
            latitude,
            longitude,
        );

        if (distancia === null) {
            throw new NotFoundException(`Item com ID ${itemId} não encontrado`);
        }

        return {
            distanciaMetros: distancia,
            distanciaFormatada: this.formatarDistancia(distancia),
        };
    }

    /**
     * Retorna estatísticas de disponibilidade geográfica.
     * Útil para analytics ou dashboard.
     *
     * @param latitude
     * @param longitude
     * @param raiosMetros - Array de raios para calcular (ex: [1000, 5000, 10000])
     * @returns Contagem de itens por raio
     */
    async obterEstatisticasPorProximidade(
        latitude: number,
        longitude: number,
        raiosMetros: number[] = [1000, 5000, 10000, 50000],
    ): Promise<{ raioMetros: number; quantidadeItens: number }[]> {
        const estatisticas = await Promise.all(
            raiosMetros.map(async (raio) => {
                const quantidade =
                    await this.itemRepository.contarPorProximidade(
                        latitude,
                        longitude,
                        raio,
                    );
                return {
                    raioMetros: raio,
                    quantidadeItens: quantidade,
                };
            }),
        );

        return estatisticas;
    }

    /**
     * Formata distância em metros para formato legível.
     * - < 1000m: exibe em metros (ex: "345 m")
     * - >= 1000m: exibe em quilômetros com 1 casa decimal (ex: "2.5 km")
     *
     * @param metros - Distância em metros
     * @returns String formatada
     */
    private formatarDistancia(metros: number): string {
        if (metros < 1000) {
            return `${Math.round(metros)} m`;
        } else {
            const km = metros / 1000;
            return `${km.toFixed(1)} km`;
        }
    }

    /**
     * Valida se coordenadas estão dentro dos limites válidos.
     * Lat: -90 a 90, Lng: -180 a 180
     */
    validarCoordenadas(latitude: number, longitude: number): boolean {
        return (
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    }
}
