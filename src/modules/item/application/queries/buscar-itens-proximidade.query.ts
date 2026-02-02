import { Inject } from '@nestjs/common';
import type { ItemRepository } from '../../domain/repositories/item.repository';
import { BuscarPorProximidadeDto } from '../dtos/buscar-por-proximidade.dto';
import { ItemDto } from '../dtos/responses/item.dto';
import type { UsuarioService } from '../../domain/services/usuario.service';

export type BuscarItensProximidadeQueryProps = BuscarPorProximidadeDto & {
    usuarioId: string;
};

/**
 * Busca itens por proximidade geográfica OU itens populares.
 *
 * Regra de negócio:
 * - Apenas itens com status ATIVO são retornados
 * - Distância calculada em linha reta quando aplicável
 * - Degradação elegante: sem localização = popularidade
 */
export class BuscarItensProximidadeQuery {
    constructor(
        @Inject('ItemRepository')
        private readonly itemRepository: ItemRepository,
        @Inject('UsuarioService')
        private readonly usuarioService: UsuarioService,
    ) {}

    async execute(props: BuscarItensProximidadeQueryProps): Promise<ItemDto[]> {
        if (!props.latitude || !props.longitude) {
            const usuario = await this.usuarioService.buscar(props.usuarioId);
            if (!usuario) {
                throw new Error('Usuário não encontrado');
            }

            props.latitude = usuario.endereco?.latitude;
            props.longitude = usuario.endereco?.longitude;
            if (!props.latitude || !props.longitude) {
                return this.buscarItensPopularesSemLocalizacao(props);
            }
        }

        const itens = await this.itemRepository.buscarPorProximidade({
            latitude: props.latitude,
            longitude: props.longitude,
            raioMetros: props.raioMetros ?? 5000,
            termo: props.termo,
            tipoAnuncio: props.tipoAnuncio,
            categorias: props.categorias,
            estados: props.estados,
            precoMinimo: props.precoMinimo,
            precoMaximo: props.precoMaximo,
            exigeCaucao: props.exigeCaucao,
            ordenarPor: props.ordenarPor ?? 'distancia',
            limite: props.limite ?? 20,
            offset: props.offset ?? 0,
        });

        return itens.map((item) => {
            item.adicionarProprietario(props.usuarioId);
            return item.toDto();
        });
    }

    async buscarItensPopularesSemLocalizacao(
        props: BuscarItensProximidadeQueryProps,
    ) {
        const itensPopulares =
            await this.itemRepository.buscarItensPopularesSemLocalizacao({
                termo: props.termo,
                tipoAnuncio: props.tipoAnuncio,
                categorias: props.categorias,
                estados: props.estados,
                exigeCaucao: props.exigeCaucao,
                precoMinimoPorDia: props.precoMinimo,
                precoMaximoPorDia: props.precoMaximo,
                limite: props.limite ?? 20,
                offset: props.offset ?? 0,
            });

        const itensPopularesLocalizacao: ItemDto[] = itensPopulares.map(
            (item) => item.toDto(),
        );

        return itensPopularesLocalizacao;
    }
}
