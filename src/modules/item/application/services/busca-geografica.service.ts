import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';

export type BuscarMaisProximosProps = {
    latitude: number;
    longitude: number;
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

    // /**
    //  * Busca itens por proximidade geográfica OU itens populares.
    //  *
    //  * Estratégia inteligente:
    //  * - Se latitude/longitude fornecidos: busca por proximidade (PostGIS)
    //  * - Se NÃO fornecidos: retorna itens populares (ordenado por aluguelsTotais)
    //  *
    //  * Regra de negócio:
    //  * - Apenas itens com status ATIVO são retornados
    //  * - Distância calculada em linha reta quando aplicável
    //  * - Resultados podem ser filtrados por categoria, preço e estado
    //  * - Degradação elegante: sem localização = popularidade
    //  */
    // async buscarPorProximidade(
    //     props: BuscarPorProximidadeDTO,
    // ): Promise<ItemComDistanciaDto[]> {
    //     if (!props.latitude || !props.longitude) {
    //         const itensPopulares = await this.itemRepository.buscarItensPopularesSemLocalizacao({
    //             categorias: props.categorias,
    //             precoMaximoPorDia: props.precoMaximoPorDia,
    //             estadoMinimo: props.estadoMinimo,
    //             limite: props.limite ?? 20,
    //             offset: props.offset ?? 0,
    //         });

    //         const itensPopularesLocalizacao: ItemComDistanciaDto[] =
    //             itensPopulares.map((item) => ({
    //                 item: item.toDto(),
    //                 distanciaMetros: null,
    //                 distanciaFormatada: null,
    //             }));

    //         return itensPopularesLocalizacao;
    //     }

    //     const itensComDistancia = await this.itemRepository.buscarPorProximidade({
    //         latitude: props.latitude,
    //         longitude: props.longitude,
    //         raioMetros: props.raioMetros ?? 5000,
    //         categorias: props.categorias,
    //         precoMaximoPorDia: props.precoMaximoPorDia,
    //         estadoMinimo: props.estadoMinimo,
    //         ordenarPor: props.ordenarPor ?? 'distancia',
    //         limite: props.limite ?? 20,
    //         offset: props.offset ?? 0,
    //     });

    //     const itensComDistanciaDto: ItemComDistanciaDto[] =
    //         itensComDistancia.map((resultado) => ({
    //             item: resultado.item.toDto(),
    //             distanciaMetros: resultado.distanciaMetros,
    //             distanciaFormatada: this.formatarDistancia(
    //                 resultado.distanciaMetros,
    //             ),
    //         }));

    //     return itensComDistanciaDto;
    // }

    // /**
    //  * Busca os N itens mais próximos de um ponto (sem limite de raio).
    //  * Útil para "Itens perto de você" ou "Recomendações por proximidade".
    //  *
    //  * Regra de negócio:
    //  * - Apenas itens ATIVO
    //  * - Ordenação sempre por distância crescente
    //  * - Limite padrão de 10 itens
    //  *
    //  * @param props - Coordenadas e limite
    //  * @returns Lista de itens mais próximos
    //  */
    // async buscarMaisProximos(
    //     props: BuscarMaisProximosProps,
    // ): Promise<Paginacao<ItemComDistanciaDto>> {
    //     let itens: Paginacao<Item> | Paginacao<ItemComDistanciaDto>;

    //     if (!props.latitude || !props.longitude) {
    //         itens = await this.itemRepository.buscarItensAleatorios(
    //             props.limite ?? 10,
    //             props.offset ?? 0,
    //         );
    //     } else {
    //         itens = await this.itemRepository.buscarMaisProximos(
    //             props.latitude,
    //             props.longitude,
    //             props.limite ?? 10,
    //             props.offset ?? 0,
    //         );
    //     }

    //     const paginacao: Paginacao<ItemComDistanciaDto> = {
    //         total: itensComDistancia.total,
    //         limite: itensComDistancia.limite,
    //         pagina: itensComDistancia.pagina,
    //         totalPaginas: itensComDistancia.totalPaginas,
    //         data: ,
    //     };

    //     return itensComDistancia.map((resultado) => ({
    //         item: resultado.item.toDto(),
    //         distanciaMetros: resultado.distanciaMetros,
    //         distanciaFormatada: this.formatarDistancia(
    //             resultado.distanciaMetros,
    //         ),
    //     }));
    // }

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
}
