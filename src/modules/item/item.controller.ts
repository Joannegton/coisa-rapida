import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Body,
    UseInterceptors,
    UploadedFiles,
    Get,
    Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
    AuditarCriacaoItem,
    Publico,
    usuarioAtual,
} from 'src/common/decorators';
import { CriarItemUseCase } from './application/usecases/criar-item.usecase';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { CriarItemDto } from './application/dtos/criar-item.dto';
import { BuscarPorProximidadeDto } from './application/dtos/buscar-por-proximidade.dto';
import { BuscarItensProximidadeQuery } from './application/queries/buscar-itens-proximidade.query';
import { ItemComDistanciaDto } from './application/dtos/responses/item-distancia.dto';
import { ItemCardDto } from './application/dtos/responses/item-cards.dto';

@ApiTags('item')
@Controller('item')
export class ItemController {
    constructor(
        private readonly criarItemUseCase: CriarItemUseCase,
        private readonly buscarItensProximidadeQuery: BuscarItensProximidadeQuery,
    ) {}

    @ApiOperation({
        summary: 'Criar um novo item',
        description: 'Cria um novo item para o usuário autenticado.',
    })
    @ApiResponse({
        status: 201,
        description: 'Item criado com sucesso.',
    })
    @ApiBody({ type: CriarItemDto })
    @ApiAccessToken()
    @HttpCode(HttpStatus.CREATED)
    @AuditarCriacaoItem()
    @UseInterceptors(FilesInterceptor('fotos'))
    @Post()
    async criarItem(
        @usuarioAtual() usuario: UsuarioPayload,
        @Body() criarItemDto: CriarItemDto,
        @UploadedFiles() fotos: Express.Multer.File[],
    ): Promise<void> {
        return this.criarItemUseCase.execute({
            ...criarItemDto,
            fotos,
            usuarioId: usuario.sub,
        });
    }

    @ApiOperation({
        summary: 'Buscar itens (proximidade, populares ou busca avançada)',
        description:
            '🔍 **Endpoint inteligente e completo de busca de itens**\n\n' +
            '### Modos de operação:\n\n' +
            '1. **Busca por proximidade**: Com localização do usuário → PostGIS geográfico\n' +
            '2. **Itens populares**: Sem localização → Ordenado por popularidade\n' +
            '3. **Busca avançada**: Filtragem por termo, categoria, estado, preço\n\n' +
            '### Filtros disponíveis:\n\n' +
            '- `termo`: Busca em nome e descrição (mínimo 3 caracteres)\n' +
            '- `categorias`: Array de categorias (ex: ELETRONICOS, FERRAMENTAS)\n' +
            '- `estados`: Array de estados específicos (ex: NOVO, COMO_NOVO, BOM)\n' +
            '- `precoMinimoPorDia` / `precoMaximoPorDia`: Faixa de preço\n' +
            '- `raioMetros`: Raio de busca (padrão: 5000m)\n\n' +
            '### Ordenação:\n\n' +
            '- `distancia`: Mais próximos primeiro (requer localização)\n' +
            '- `preco`: Menor preço primeiro\n' +
            '- `popularidade`: Mais alugados primeiro\n' +
            '- `relevancia`: Por relevância do termo de busca (requer termo)\n\n' +
            '### Exemplos de uso:\n\n' +
            '```\n' +
            '// Busca geográfica básica\n' +
            'GET /item?raioMetros=10000\n\n' +
            '// Busca por termo\n' +
            'GET /item?termo=furadeira&ordenarPor=relevancia\n\n' +
            '// Busca avançada completa\n' +
            'GET /item?termo=bicicleta&categorias=ESPORTES&estados=NOVO,COMO_NOVO&precoMaximoPorDia=50&ordenarPor=preco\n' +
            '```',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de itens encontrados com distância calculada',
        type: ItemComDistanciaDto,
        isArray: true,
    })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Get()
    async buscarPorProximidade(
        @usuarioAtual() usuario: UsuarioPayload,
        @Query() dto: BuscarPorProximidadeDto,
    ): Promise<ItemComDistanciaDto[]> {
        return this.buscarItensProximidadeQuery.execute({
            ...dto,
            usuarioId: usuario.sub,
        });
    }

    // /**
    //  * Busca os N itens mais próximos de um ponto (sem limite de raio).
    //  * Útil para "Itens perto de você" ou recomendações.
    //  *
    //  * Exemplo:
    //  * - GET /itens/buscar/mais-proximos?latitude=-23.5505&longitude=-46.6333&limite=10
    //  *
    //  * @param dto - Coordenadas e limite
    //  * @returns Lista de itens ordenados por proximidade
    //  */
    // @Publico()
    // @Get('buscar/mais-proximos')
    // @HttpCode(HttpStatus.OK)
    // @ApiOperation({
    //     summary: 'Buscar itens mais próximos',
    //     description:
    //         'Retorna os N itens mais próximos de um ponto geográfico, sem limite de raio. Ordenado sempre por distância crescente.',
    // })
    // @ApiResponse({
    //     status: 200,
    //     description: 'Lista de itens mais próximos',
    //     type: [ItemComDistanciaDTO],
    // })
    // @ApiQuery({
    //     name: 'latitude',
    //     required: true,
    //     type: Number,
    //     example: -23.5505,
    // })
    // @ApiQuery({
    //     name: 'longitude',
    //     required: true,
    //     type: Number,
    //     example: -46.6333,
    // })
    // @ApiQuery({ name: 'limite', required: false, type: Number, example: 10 })
    // @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    // async buscarMaisProximos(
    //     @Query() dto: BuscarMaisProximosDTO,
    // ): Promise<ItemComDistanciaDTO[]> {
    //     return this.buscaGeograficaService.buscarMaisProximos(dto);
    // }

    // /**
    //  * Calcula a distância entre um item específico e um ponto geográfico.
    //  *
    //  * Exemplo:
    //  * - GET /itens/123e4567-e89b-12d3-a456-426614174000/distancia?latitude=-23.5505&longitude=-46.6333
    //  *
    //  * @param itemId - ID do item
    //  * @param latitude - Query param latitude
    //  * @param longitude - Query param longitude
    //  * @returns Distância em metros e formatada
    //  */
    // @Publico()
    // @Get(':itemId/distancia')
    // @HttpCode(HttpStatus.OK)
    // @ApiOperation({
    //     summary: 'Calcular distância até um item',
    //     description:
    //         'Calcula a distância em linha reta (great circle) entre um item e coordenadas fornecidas.',
    // })
    // @ApiResponse({
    //     status: 200,
    //     description: 'Distância calculada',
    //     schema: {
    //         properties: {
    //             distanciaMetros: { type: 'number', example: 1234.56 },
    //             distanciaFormatada: { type: 'string', example: '1.2 km' },
    //         },
    //     },
    // })
    // @ApiResponse({ status: 404, description: 'Item não encontrado' })
    // @ApiQuery({
    //     name: 'latitude',
    //     required: true,
    //     type: Number,
    //     example: -23.5505,
    // })
    // @ApiQuery({
    //     name: 'longitude',
    //     required: true,
    //     type: Number,
    //     example: -46.6333,
    // })
    // async calcularDistancia(
    //     @Param('itemId') itemId: string,
    //     @Query('latitude') latitude: number,
    //     @Query('longitude') longitude: number,
    // ): Promise<{ distanciaMetros: number; distanciaFormatada: string }> {
    //     return this.buscaGeograficaService.calcularDistanciaParaItem(
    //         itemId,
    //         parseFloat(latitude.toString()),
    //         parseFloat(longitude.toString()),
    //     );
    // }

    // /**
    //  * Retorna estatísticas de disponibilidade geográfica por raios.
    //  * Útil para analytics ou indicadores de cobertura.
    //  *
    //  * Exemplo:
    //  * - GET /itens/estatisticas/proximidade?latitude=-23.5505&longitude=-46.6333
    //  *
    //  * @param latitude
    //  * @param longitude
    //  * @returns Contagem de itens em diferentes raios (1km, 5km, 10km, 50km)
    //  */
    // @Publico()
    // @Get('estatisticas/proximidade')
    // @HttpCode(HttpStatus.OK)
    // @ApiOperation({
    //     summary: 'Estatísticas de disponibilidade por proximidade',
    //     description:
    //         'Retorna quantos itens ativos existem em diferentes raios a partir de um ponto (1km, 5km, 10km, 50km).',
    // })
    // @ApiResponse({
    //     status: 200,
    //     description: 'Estatísticas de disponibilidade',
    //     schema: {
    //         type: 'array',
    //         items: {
    //             properties: {
    //                 raioMetros: { type: 'number', example: 5000 },
    //                 quantidadeItens: { type: 'number', example: 42 },
    //             },
    //         },
    //     },
    // })
    // @ApiQuery({
    //     name: 'latitude',
    //     required: true,
    //     type: Number,
    //     example: -23.5505,
    // })
    // @ApiQuery({
    //     name: 'longitude',
    //     required: true,
    //     type: Number,
    //     example: -46.6333,
    // })
    // async obterEstatisticasProximidade(
    //     @Query('latitude') latitude: number,
    //     @Query('longitude') longitude: number,
    // ): Promise<{ raioMetros: number; quantidadeItens: number }[]> {
    //     return this.buscaGeograficaService.obterEstatisticasPorProximidade(
    //         parseFloat(latitude.toString()),
    //         parseFloat(longitude.toString()),
    //     );
    // }
}
