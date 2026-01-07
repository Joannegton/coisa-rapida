import { Inject } from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { ItemComDistanciaDto } from '../dtos/responses/item-distancia.dto';
import { Utils } from 'src/shared/utils';
import { BuscarPorProximidadeDto } from '../dtos/buscar-por-proximidade.dto';

export type BuscarItensProximidadeQueryProps = BuscarPorProximidadeDto & {
    usuarioId: string;
};

/**
 * Busca itens por proximidade geográfica OU itens populares.
 *
 * Estratégia inteligente:
 * - Se latitude/longitude fornecidos NO REQUEST (via Flutter): busca por proximidade (PostGIS)
 * - Se NÃO fornecidos: retorna itens populares (ordenado por aluguelsTotais)
 *
 * Regra de negócio:
 * - Apenas itens com status ATIVO são retornados
 * - Distância calculada em linha reta quando aplicável
 * - Resultados podem ser filtrados por categoria, preço e estado
 * - Degradação elegante: sem localização = popularidade
 */
export class BuscarItensProximidadeQuery {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
    ) {}

    async execute(
        props: BuscarItensProximidadeQueryProps,
    ): Promise<ItemComDistanciaDto[]> {
        if (!props.latitude || !props.longitude) {
            const itensPopulares =
                await this.itemRepository.buscarItensPopularesSemLocalizacao({
                    termo: props.termo,
                    categorias: props.categorias,
                    estados: props.estados,
                    precoMinimoPorDia: props.precoMinimoPorDia,
                    precoMaximoPorDia: props.precoMaximoPorDia,
                    limite: props.limite ?? 20,
                    offset: props.offset ?? 0,
                });

            const itensPopularesLocalizacao: ItemComDistanciaDto[] =
                itensPopulares.map((item) => ({
                    item: item.toDto(),
                    distanciaMetros: null,
                    distanciaFormatada: null,
                }));

            return itensPopularesLocalizacao;
        }

        const itensComDistancia =
            await this.itemRepository.buscarPorProximidade({
                latitude: props.latitude,
                longitude: props.longitude,
                raioMetros: props.raioMetros ?? 5000,
                termo: props.termo,
                categorias: props.categorias,
                estados: props.estados,
                precoMinimoPorDia: props.precoMinimoPorDia,
                precoMaximoPorDia: props.precoMaximoPorDia,
                ordenarPor: props.ordenarPor ?? 'distancia',
                limite: props.limite ?? 20,
                offset: props.offset ?? 0,
            });

        const itensComDistanciaDto: ItemComDistanciaDto[] =
            itensComDistancia.map((resultado) => ({
                item: resultado.item.toCardDto(),
                distanciaMetros: resultado.distanciaMetros,
                distanciaFormatada: Utils.formatarDistancia(
                    resultado.distanciaMetros!,
                ),
            }));

        return itensComDistanciaDto;
    }
}
