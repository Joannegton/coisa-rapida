import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Body,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuditarCriacaoItem, usuarioAtual } from 'src/common/decorators';
import { CriarItemUseCase } from './application/usecases/criar-item.usecase';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { CriarItemDto } from './application/dtos/criar-item.dto';

@ApiTags('item')
@Controller('item')
export class ItemController {
    constructor(private readonly criarItemUseCase: CriarItemUseCase) {}

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

    // /**
    //  * Busca itens por proximidade geográfica dentro de um raio específico.
    //  *
    //  * Exemplos de uso:
    //  * - GET /itens/buscar/proximidade?latitude=-23.5505&longitude=-46.6333&raioMetros=5000
    //  * - GET /itens/buscar/proximidade?latitude=-23.5505&longitude=-46.6333&raioMetros=10000&categorias=ELETRONICOS&categorias=FERRAMENTAS&ordenarPor=preco
    //  *
    //  * @param dto - Query params com coordenadas, raio e filtros
    //  * @returns Lista de itens com distância calculada
    //  */
    // @Publico()
    // @Get('buscar/proximidade')
    // @HttpCode(HttpStatus.OK)
    // @ApiOperation({
    //     summary: 'Buscar itens por proximidade geográfica',
    //     description:
    //         'Retorna itens dentro de um raio específico (em metros) a partir de coordenadas lat/lng. Utiliza PostGIS para consultas espaciais otimizadas com índice GiST.',
    // })
    // @ApiResponse({
    //     status: 200,
    //     description: 'Lista de itens encontrados com distância calculada',
    //     type: [ItemComDistanciaDto],
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
    // @ApiQuery({
    //     name: 'raioMetros',
    //     required: false,
    //     type: Number,
    //     example: 5000,
    //     description: 'Raio de busca em metros (padrão: 5000m)',
    // })
    // @ApiQuery({
    //     name: 'categorias',
    //     required: false,
    //     isArray: true,
    //     example: ['ELETRONICOS', 'FERRAMENTAS'],
    // })
    // @ApiQuery({
    //     name: 'precoMaximoPorDia',
    //     required: false,
    //     type: Number,
    //     example: 100,
    // })
    // @ApiQuery({
    //     name: 'estadoMinimo',
    //     required: false,
    //     example: 'BOM',
    // })
    // @ApiQuery({
    //     name: 'ordenarPor',
    //     required: false,
    //     enum: ['distancia', 'preco', 'popularidade'],
    //     example: 'distancia',
    // })
    // @ApiQuery({ name: 'limite', required: false, type: Number, example: 20 })
    // @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
    // async buscarPorProximidade(
    //     @Query() dto: BuscarPorProximidadeDTO,
    // ): Promise<ItemComDistanciaDTO[]> {
    //     return this.buscaGeograficaService.buscarPorProximidade(dto);
    // }

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
