import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditarSolicitacaoAluguel, usuarioAtual } from 'src/common/decorators';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import { SolicitarAluguelDto } from './application/dtos/solicitar-aluguel.dto';
import { SolicitarAluguelUseCase } from './application/usecases/solicitar-aluguel.usecase';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { AluguelDto } from './application/dtos/results/Aluguel.dto';
import { ListarAlugueisUsuarioUseCase } from './application/usecases/listar-alugueis-usuario.usecase';

@ApiTags('core')
@Controller()
export class CoreController {
    constructor(
        private readonly solicitarAluguelUseCase: SolicitarAluguelUseCase,
        private readonly listarAlugueisPorUsuarioUseCase: ListarAlugueisUsuarioUseCase,
    ) {}

    @ApiOperation({
        summary: 'Solicitar aluguel de um item',
        description:
            'Solicita o aluguel de um item para o usuário autenticado.',
    })
    @ApiResponse({
        status: 201,
        description: 'Aluguel solicitado com sucesso.',
    })
    @ApiBody({ type: SolicitarAluguelDto })
    @ApiAccessToken()
    @HttpCode(HttpStatus.CREATED)
    @AuditarSolicitacaoAluguel()
    @Post('aluguel')
    async solicitarAluguel(
        @usuarioAtual() usuario: UsuarioPayload,
        @Body() props: SolicitarAluguelDto,
    ) {
        return this.solicitarAluguelUseCase.execute({
            ...props,
            usuarioId: usuario.sub,
        });
    }

    @ApiOperation({
        summary: 'Buscar alugueis que o usuario participa',
        description:
            'Busca todos os alugueis que o usuario autenticado participa.',
    })
    @ApiResponse({
        status: 200,
        description: 'Alugueis buscados com sucesso.',
        type: AluguelDto,
    })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Post('aluguel/buscar-por-usuario')
    async listarAlugueisPorUsuario(
        @usuarioAtual() usuario: UsuarioPayload,
    ): Promise<AluguelDto[]> {
        return this.listarAlugueisPorUsuarioUseCase.execute(usuario.sub);
    }
}
