import { Controller, Put, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AdicionarEnderecoUsecase } from '../application/usecases/usuario/adicionar-endereco.usecase';
import { EnderecoDto } from '../application/dtos/endereco.dto';
import { AuditarAlteracaoEndereco, usuarioAtual } from 'src/common/decorators';
import type { UsuarioPayload } from 'src/modules/auth/infra/services/jwt.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';

/**
 * Controller de Usuário
 *
 * Exemplos:
 * - GET /usuario/me (protegida)
 * - GET /usuario/public/:id (pública)
 */
@Controller('usuario')
@ApiTags('usuario')
export class UsuarioController {
    constructor(
        private readonly adicionarEnderecoUsecase: AdicionarEnderecoUsecase,
    ) {}

    @ApiOperation({
        summary: 'Definir endereço do usuário',
        description: 'Adiciona ou atualiza o endereço do usuário autenticado',
    })
    @ApiResponse({
        status: 200,
        description: 'Endereço adicionado/atualizado com sucesso',
    })
    @ApiBody({ type: EnderecoDto })
    @ApiAccessToken()
    @AuditarAlteracaoEndereco()
    @HttpCode(HttpStatus.OK)
    @Put('endereco')
    async definirEndereco(
        @usuarioAtual() usuario: UsuarioPayload,
        @Body() props: EnderecoDto,
    ) {
        return await this.adicionarEnderecoUsecase.execute({
            endereco: props,
            usuarioId: usuario.sub,
        });
    }

    /**
     * Rota PÚBLICA (sem autenticação)
     * Usa @Publico() decorator
     *
     * Exemplo:
     * GET /usuario/public/123
     */
    // @Publico()
    // @Get('public/:id')
    // async getPublic(@Param('id') id: string) {
    //     const usuario = await this.usuarioRepository.buscarPorId(id);
    //     if (!usuario) {
    //         return { erro: 'Usuário não encontrado' };
    //     }
    //     return {
    //         id: usuario.id,
    //         nome: usuario.nome,
    //     };
    // }
}
