import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ItemModel, StatusItem } from '../models/item.model';
import { ItemMapper } from '../mappers/item.mapper';
import { Item } from '../../domain/item';
import {
    ItemRepository,
    FiltrosGeograficos,
    ResultadoBuscaGeografica,
    BuscarItensPopularesSemLocalizacaoProps,
} from '../../domain/repositories/item.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryException } from 'src/common/exceptions/repository.exception';

@Injectable()
export class ItemRepositoryImpl implements ItemRepository {
    private readonly logger = new Logger(ItemRepositoryImpl.name);

    constructor(
        private readonly itemMapper: ItemMapper,
        @InjectRepository(ItemModel)
        private readonly repository: Repository<ItemModel>,
    ) {}

    async criar(item: Item): Promise<Item> {
        try {
            const model = this.itemMapper.toModel(item);
            const itemSalvo = await this.repository.save(model);
            return this.itemMapper.toDomain(itemSalvo);
        } catch (error) {
            this.logger.error(
                `Erro ao criar item: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao criar item');
        }
    }

    async buscarItensPopularesSemLocalizacao(
        props: BuscarItensPopularesSemLocalizacaoProps,
    ): Promise<Item[]> {
        try {
            const queryBuilder = this.repository
                .createQueryBuilder('item')
                .leftJoinAndSelect('item.fotos', 'fotos')
                .leftJoinAndSelect('item.disponibilidade', 'disponibilidade')
                .where('item.status = :status', { status: StatusItem.ATIVO })
                .orderBy('item.aluguelsTotais', 'DESC')
                .addOrderBy('item.criadoEm', 'DESC');

            if (props.termo) {
                queryBuilder.andWhere(
                    '(LOWER(item.nome) LIKE LOWER(:termo) OR LOWER(item.descricao) LIKE LOWER(:termo))',
                    { termo: `%${props.termo}%` },
                );
            }

            if (props.categorias && props.categorias.length > 0) {
                queryBuilder.andWhere('item.categoria IN (:...categorias)', {
                    categorias: props.categorias,
                });
            }

            // Filtro por estados específicos (prioridade sobre estadoMinimo)
            if (props.estados && props.estados.length > 0) {
                queryBuilder.andWhere('item.estado IN (:...estados)', {
                    estados: props.estados,
                });
            }

            if (props.precoMinimoPorDia) {
                queryBuilder.andWhere(
                    'item.precoPorDia >= :precoMinimoPorDia',
                    {
                        precoMinimoPorDia: props.precoMinimoPorDia,
                    },
                );
            }

            if (props.precoMaximoPorDia) {
                queryBuilder.andWhere(
                    'item.precoPorDia <= :precoMaximoPorDia',
                    {
                        precoMaximoPorDia: props.precoMaximoPorDia,
                    },
                );
            }

            queryBuilder.skip(props.offset).take(props.limite);

            const models = await queryBuilder.getMany();
            return models.map((m) => this.itemMapper.toDomain(m));
        } catch (error) {
            this.logger.error(
                `Erro ao buscar itens populares sem localização: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException('Erro ao buscar itens populares');
        }
    }

    /**
     * Busca itens dentro de um raio específico (em metros) a partir de um ponto geográfico.
     * Utiliza PostGIS ST_DWithin para consulta otimizada com índice GiST.
     */
    async buscarPorProximidade(
        filtros: FiltrosGeograficos,
    ): Promise<ResultadoBuscaGeografica[]> {
        const {
            latitude,
            longitude,
            raioMetros,
            termo,
            categorias,
            estados,
            precoMinimoPorDia,
            precoMaximoPorDia,
            ordenarPor = 'distancia',
            limite = 50,
            offset = 0,
        } = filtros;

        try {
            let query = this.repository
                .createQueryBuilder('item')
                .leftJoinAndSelect('item.fotos', 'fotos')
                .leftJoinAndSelect('item.disponibilidade', 'disponibilidade')
                .addSelect(
                    `ST_Distance(
                    item.ponto,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                )`,
                    'distancia_metros',
                )
                .where(
                    `ST_DWithin(
                    item.ponto,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :raioMetros
                )`,
                )
                .andWhere('item.status = :status', { status: 'ATIVO' })
                .setParameters({
                    latitude,
                    longitude,
                    raioMetros,
                });

            if (termo) {
                query = query.andWhere(
                    '(LOWER(item.nome) LIKE LOWER(:termo) OR LOWER(item.descricao) LIKE LOWER(:termo))',
                    { termo: `%${termo}%` },
                );
            }

            if (categorias && categorias.length > 0) {
                query = query.andWhere('item.categoria IN (:...categorias)', {
                    categorias,
                });
            }

            if (estados && estados.length > 0) {
                query = query.andWhere('item.estado IN (:...estados)', {
                    estados,
                });
            }

            if (precoMinimoPorDia) {
                query = query.andWhere(
                    'item.precoPorDia >= :precoMinimoPorDia',
                    {
                        precoMinimoPorDia,
                    },
                );
            }

            if (precoMaximoPorDia) {
                query = query.andWhere(
                    'item.precoPorDia <= :precoMaximoPorDia',
                    {
                        precoMaximoPorDia,
                    },
                );
            }

            switch (ordenarPor) {
                case 'distancia':
                    query = query.orderBy('distancia_metros', 'ASC');
                    break;
                case 'preco':
                    query = query
                        .orderBy('item.precoPorDia', 'ASC')
                        .addOrderBy('distancia_metros', 'ASC');
                    break;
                case 'popularidade':
                    query = query
                        .orderBy('item.aluguelsTotais', 'DESC')
                        .addOrderBy('distancia_metros', 'ASC');
                    break;
                case 'relevancia':
                    // Ordenação por relevância quando há termo de busca
                    if (termo) {
                        query = query
                            .addSelect(
                                `(
                                CASE 
                                    WHEN LOWER(item.nome) = LOWER(:termoExato) THEN 1
                                    WHEN LOWER(item.nome) LIKE LOWER(:termoInicio) THEN 2
                                    WHEN LOWER(item.nome) LIKE LOWER(:termo) THEN 3
                                    ELSE 4
                                END
                            )`,
                                'relevancia',
                            )
                            .setParameters({
                                termoExato: termo,
                                termoInicio: `${termo}%`,
                            })
                            .orderBy('relevancia', 'ASC')
                            .addOrderBy('item.aluguelsTotais', 'DESC')
                            .addOrderBy('distancia_metros', 'ASC');
                    } else {
                        // Sem termo, relevância = popularidade
                        query = query
                            .orderBy('item.aluguelsTotais', 'DESC')
                            .addOrderBy('distancia_metros', 'ASC');
                    }
                    break;
            }

            query = query.skip(offset).take(limite);

            const rawAndEntities = await query.getRawAndEntities();

            const resultados: ResultadoBuscaGeografica[] =
                rawAndEntities.entities.map((model, index) => ({
                    item: this.itemMapper.toDomain(model),
                    distanciaMetros: Number.parseFloat(
                        rawAndEntities.raw[index].distancia_metros,
                    ),
                }));

            return resultados;
        } catch (error) {
            this.logger.error(
                `Erro ao buscar itens por proximidade: ${error.message}`,
                error.stack,
            );
            throw new RepositoryException(
                'Erro ao buscar itens por proximidade',
            );
        }
    }

    /**
     * Calcula a distância (em metros) entre um item específico e um ponto geográfico.
     */
    async calcularDistancia(
        itemId: string,
        latitude: number,
        longitude: number,
    ): Promise<number | null> {
        const result = await this.repository
            .createQueryBuilder('item')
            .select(
                `ST_Distance(
                    item.ponto,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                )`,
                'distancia',
            )
            .where('item.id = :itemId', { itemId })
            .setParameters({ latitude, longitude })
            .getRawOne();

        return result ? Number.parseFloat(result.distancia) : null;
    }

    /**
     * Conta quantos itens ativos existem dentro de um raio.
     */
    async contarPorProximidade(
        latitude: number,
        longitude: number,
        raioMetros: number,
    ): Promise<number> {
        return this.repository
            .createQueryBuilder('item')
            .where(
                `ST_DWithin(
                    item.ponto,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :raioMetros
                )`,
            )
            .andWhere('item.status = :status', { status: 'ATIVO' })
            .setParameters({ latitude, longitude, raioMetros })
            .getCount();
    }

    async buscarParaArquivamento(): Promise<Item[]> {
        const noventaDiasAtras = new Date();
        noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90);

        const models = await this.repository.find({
            where: {
                ultimaVisualizacao: { '<': noventaDiasAtras },
            } as any,
        });
        return models.map((m) => this.itemMapper.toDomain(m));
    }

    async buscarPendentesAprovacao(
        pagina?: number,
        limite?: number,
    ): Promise<Item[]> {
        const skip = pagina && limite ? (pagina - 1) * limite : 0;
        const take = limite || 10;
        const models = await this.repository.find({
            where: { status: StatusItem.PENDENTE },
            skip,
            take,
        });
        return models.map((m) => this.itemMapper.toDomain(m));
    }

    async buscarAtivosDoUsuario(usuarioId: string): Promise<Item[]> {
        const models = await this.repository.find({
            where: { usuarioId, status: StatusItem.ATIVO },
        });
        return models.map((m) => this.itemMapper.toDomain(m));
    }

    /**
     * Retorna estados permitidos a partir de um estado mínimo.
     * Ordem de qualidade: NOVO > COMO_NOVO > BOM > REGULAR > PARA_CONSERTAR
     */
    private getEstadosAPartirDe(estadoMinimo: string): string[] {
        const hierarquia = [
            'NOVO',
            'COMO_NOVO',
            'BOM',
            'REGULAR',
            'PARA_CONSERTAR',
        ];
        const indice = hierarquia.indexOf(estadoMinimo.toUpperCase());
        return indice >= 0 ? hierarquia.slice(0, indice + 1) : hierarquia;
    }
}
