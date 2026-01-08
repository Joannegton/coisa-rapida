import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { usuarioAtual } from 'src/common/decorators';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import { SolicitarAluguelDto } from './application/dtos/solicitar-aluguel.dto';
import { SolicitarAluguelUseCase } from './application/usecases/solicitar-aluguel.usecase';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';

@ApiTags('core')
@Controller()
export class CoreController {
    constructor(
        private readonly solicitarAluguelUseCase: SolicitarAluguelUseCase,
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
    // @AuditarSolicitacaoAluguel()
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
}
