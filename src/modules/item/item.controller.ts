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
    Param,
    Patch,
    Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
    AuditarAtualizacaoItem,
    AuditarCriacaoItem,
    usuarioAtual,
} from 'src/common/decorators';
import { CriarItemUseCase } from './application/usecases/criar-item.usecase';
import { AtualizarItemUseCase } from './application/usecases/atualizar-item.usecase';
import { AdicionarFotosItemUseCase } from './application/usecases/adicionar-fotos-item.usecase';
import { RemoverFotoItemUseCase } from './application/usecases/remover-foto-item.usecase';
import { AtualizarOrdemFotosItemUseCase } from './application/usecases/atualizar-ordem-fotos-item.usecase';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { CriarItemDto } from './application/dtos/criar-item.dto';
import { AtualizarItemDTO } from './application/dtos/atualizar-item.dto';
import { AdicionarFotosItemDTO } from './application/dtos/adicionar-fotos-item.dto';
import { AtualizarOrdemFotosDTO } from './application/dtos/atualizar-ordem-fotos.dto';
import { BuscarPorProximidadeDto } from './application/dtos/buscar-por-proximidade.dto';
import { BuscarItensProximidadeQuery } from './application/queries/buscar-itens-proximidade.query';
import { ItemComDistanciaDto } from './application/dtos/responses/item-distancia.dto';
import { BuscarItemQuery } from './application/queries/buscar-item.query';
import { BuscarItemDto } from './application/dtos/buscar-item.dto';
import { ItemFotoDto } from './application/dtos/responses/item-foto.dto';

@ApiTags('item')
@Controller('item')
export class ItemController {
    constructor(
        private readonly criarItemUseCase: CriarItemUseCase,
        private readonly atualizarItemUseCase: AtualizarItemUseCase,
        private readonly adicionarFotosItemUseCase: AdicionarFotosItemUseCase,
        private readonly removerFotoItemUseCase: RemoverFotoItemUseCase,
        private readonly atualizarOrdemFotosItemUseCase: AtualizarOrdemFotosItemUseCase,
        private readonly buscarItensProximidadeQuery: BuscarItensProximidadeQuery,
        private readonly buscarItemQuery: BuscarItemQuery,
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
        summary: 'Atualizar um item existente',
        description:
            'Atualiza informações de um item. Apenas o dono do item pode atualizar.',
    })
    @ApiResponse({
        status: 200,
        description: 'Item atualizado com sucesso.',
    })
    @ApiBody({ type: AtualizarItemDTO })
    @ApiAccessToken()
    @AuditarAtualizacaoItem()
    @HttpCode(HttpStatus.OK)
    @Patch(':itemId')
    async atualizarItem(
        @Param('itemId') itemId: string,
        @usuarioAtual() usuario: UsuarioPayload,
        @Body() atualizarItemDto: AtualizarItemDTO,
    ): Promise<void> {
        return this.atualizarItemUseCase.execute({
            ...atualizarItemDto,
            itemId,
            usuarioId: usuario.sub,
        });
    }

    @ApiOperation({
        summary: 'Adicionar fotos ao item',
        description:
            'Adiciona 1-3 novas fotos ao item sem remover as existentes.\n' +
            '- Total máximo de fotos: 3\n' +
            '- Pode especificar qual foto será principal\n' +
            '- Fotos são agendadas para verificação de conteúdo',
    })
    @ApiResponse({
        status: 201,
        description: 'Fotos adicionadas com sucesso.',
        type: ItemFotoDto,
    })
    @ApiBody({ type: AdicionarFotosItemDTO })
    @ApiAccessToken()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FilesInterceptor('fotos'))
    @Post(':itemId/fotos')
    async adicionarFotosItem(
        @Param('itemId') itemId: string,
        @usuarioAtual() usuario: UsuarioPayload,
        @UploadedFiles() fotos: Express.Multer.File[],
        @Body() dto: AdicionarFotosItemDTO,
    ) {
        return this.adicionarFotosItemUseCase.execute({
            itemId,
            usuarioId: usuario.sub,
            fotos,
            fotoPrincipalId: dto.fotoPrincipalId,
        });
    }

    @ApiOperation({
        summary: 'Remover uma foto do item',
        description:
            'Remove uma foto específica do item.\n' +
            '- Item deve ter no mínimo 1 foto\n' +
            '- Se remover a principal, a primeira foto se torna principal\n' +
            '- Ordem das fotos é recalculada automaticamente',
    })
    @ApiResponse({
        status: 204,
        description: 'Foto removida com sucesso.',
    })
    @ApiAccessToken()
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':itemId/fotos/:fotoId')
    async removerFotoItem(
        @Param('itemId') itemId: string,
        @Param('fotoId') fotoId: string,
        @usuarioAtual() usuario: UsuarioPayload,
    ): Promise<void> {
        return this.removerFotoItemUseCase.execute({
            itemId,
            fotoId,
            usuarioId: usuario.sub,
        });
    }

    @ApiOperation({
        summary: 'Atualizar ordem das fotos',
        description:
            'Reordena as fotos e/ou muda qual é a principal.\n' +
            '- Ordem deve ser sequencial sem gaps (1, 2, 3)\n' +
            '- Deve incluir TODAS as fotos do item\n' +
            '- Pode especificar qual será a principal',
    })
    @ApiResponse({
        status: 200,
        description: 'Ordem das fotos atualizada com sucesso.',
        type: ItemFotoDto,
    })
    @ApiBody({ type: AtualizarOrdemFotosDTO })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Patch(':itemId/fotos')
    async atualizarOrdemFotosItem(
        @Param('itemId') itemId: string,
        @usuarioAtual() usuario: UsuarioPayload,
        @Body() dto: AtualizarOrdemFotosDTO,
    ) {
        return this.atualizarOrdemFotosItemUseCase.execute({
            itemId,
            usuarioId: usuario.sub,
            ordem: dto.ordem,
            fotoPrincipalId: dto.fotoPrincipalId,
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
    @Get('proximidade')
    async buscarPorProximidade(
        @usuarioAtual() usuario: UsuarioPayload,
        @Query() dto: BuscarPorProximidadeDto,
    ): Promise<ItemComDistanciaDto[]> {
        return this.buscarItensProximidadeQuery.execute({
            ...dto,
            usuarioId: usuario.sub,
        });
    }

    @ApiOperation({
        summary: 'Buscar um item por ID',
        description: 'Retorna os detalhes de um item específico pelo ID.',
    })
    @ApiResponse({
        status: 200,
        description: 'Detalhes do item encontrado',
        type: ItemComDistanciaDto,
    })
    @ApiAccessToken()
    @Get(':itemId')
    async buscarItem(
        @Param('itemId') itemId: string,
        @usuarioAtual() usuario: UsuarioPayload,
        @Query() props: BuscarItemDto,
    ): Promise<ItemComDistanciaDto> {
        return this.buscarItemQuery.execute({
            itemId,
            usuarioId: usuario.sub,
            ...props,
        });
    }
}
