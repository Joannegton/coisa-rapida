import { Controller, Get, Req, Param } from '@nestjs/common';
import { Publico } from 'src/common/decorators/public.decorator';
import { JwtPayload } from 'src/modules/auth/jwt.strategy';
import { UsuarioRepository } from '../infra/repositories/usuario.repository';

/**
 * Controller de Usuário
 *
 * Exemplos:
 * - GET /usuario/me (protegida)
 * - GET /usuario/public/:id (pública)
 */
@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioRepository: UsuarioRepository) {}

    /**
     * Rota PROTEGIDA por padrão
     * Requer: Authorization: Bearer <token>
     *
     * Exemplo:
     * GET /usuario/me
     * Headers: Authorization: Bearer eyJhbGc...
     */
    @Get('me')
    async me(@Req() req: any) {
        const user = req.user as JwtPayload;
        return {
            usuarioId: user.sub,
            email: user.email,
            mensagem: 'Dados do seu perfil',
        };
    }

    /**
     * Rota PÚBLICA (sem autenticação)
     * Usa @Publico() decorator
     *
     * Exemplo:
     * GET /usuario/public/123
     */
    @Publico()
    @Get('public/:id')
    async getPublic(@Param('id') id: string) {
        const usuario = await this.usuarioRepository.buscarPorId(id);
        if (!usuario) {
            return { erro: 'Usuário não encontrado' };
        }
        return {
            id: usuario.id,
            nome: usuario.nome,
        };
    }
}
