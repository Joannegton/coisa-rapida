import { Controller, Get, Req, Param } from '@nestjs/common';
import { Publico } from 'src/common/decorators/public.decorator';
import { UsuarioRepositoryImpl } from '../infra/repositories/usuario.repository';

/**
 * Controller de Usuário
 *
 * Exemplos:
 * - GET /usuario/me (protegida)
 * - GET /usuario/public/:id (pública)
 */
@Controller('usuario')
export class UsuarioController {
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
