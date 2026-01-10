import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Req,
} from '@nestjs/common';
import {
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuditarSolicitacaoAluguel, usuarioAtual } from 'src/common/decorators';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import { SolicitarAluguelDto } from './application/dtos/solicitar-aluguel.dto';
import { SolicitarAluguelUseCase } from './application/usecases/solicitar-aluguel.usecase';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { AluguelDto } from './application/dtos/results/Aluguel.dto';
import { AssinarContratoDto } from './application/dtos/assinar-contrato.dto';
import { ListarAlugueisUsuarioQuery } from './application/queries/listar-alugueis-usuario.query';
import { BuscarAluguelIdQuery } from './application/queries/buscar-aluguel-id.query';
import { ConfirmarAluguelUseCase } from './application/usecases/confirmar-aluguel.usecase';
import { BuscarContratoAluguelQuery } from './application/queries/buscar-contrato-aluguel.query';
import { AssinarContratoUsecase } from './application/usecases/assinar-contrato.usecase';
import type { Request } from 'express';

@ApiTags('core')
@Controller()
export class CoreController {
    constructor(
        private readonly solicitarAluguelUseCase: SolicitarAluguelUseCase,
        private readonly listarAlugueisPorUsuarioQuery: ListarAlugueisUsuarioQuery,
        private readonly buscarAluguelIdQuery: BuscarAluguelIdQuery,
        private readonly confirmarAluguelUseCase: ConfirmarAluguelUseCase,
        private readonly buscarContratoAluguelQuery: BuscarContratoAluguelQuery,
        private readonly assinarContratoUseCase: AssinarContratoUsecase,
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
    @Get('aluguel')
    async listarAlugueisPorUsuario(
        @usuarioAtual() usuario: UsuarioPayload,
    ): Promise<AluguelDto[]> {
        return this.listarAlugueisPorUsuarioQuery.execute(usuario.sub);
    }

    @ApiOperation({
        summary: 'Buscar aluguel',
        description: 'Busca aluguel por id.',
    })
    @ApiResponse({
        status: 200,
        description: 'Aluguel buscado com sucesso.',
        type: AluguelDto,
    })
    @ApiParam({ name: 'id', description: 'ID do aluguel' })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Get('aluguel/:id')
    async buscarAluguel(
        @Param('id') id: string,
        @usuarioAtual() usuario: UsuarioPayload,
    ): Promise<AluguelDto> {
        return await this.buscarAluguelIdQuery.execute({
            id,
            usuarioId: usuario.sub,
        });
    }

    @ApiOperation({
        summary: 'Buscar contrato de aluguel',
        description: 'Busca o contrato do aluguel em formato HTML.',
    })
    @ApiResponse({
        status: 200,
        description: 'Contrato buscado com sucesso.',
    })
    @ApiParam({ name: 'id', description: 'ID do aluguel' })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Get('aluguel/:id/contrato')
    buscarContrato(@Param('id') id: string) {
        return this.buscarContratoAluguelQuery.execute(id);
    }

    @ApiOperation({
        summary: 'Assinar contrato de aluguel',
        description: 'Assina o contrato de aluguel.',
    })
    @ApiResponse({
        status: 200,
        description: 'Contrato assinado com sucesso.',
    })
    @ApiParam({ name: 'id', description: 'ID do aluguel' })
    @ApiBody({ type: AssinarContratoDto })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Patch('aluguel/:id/contrato/assinar')
    async assinarContrato(
        @Param('id') id: string,
        @usuarioAtual() usuario: UsuarioPayload,
        @Req() req: Request,
        @Body() body: AssinarContratoDto,
    ): Promise<void> {
        return this.assinarContratoUseCase.execute({
            aluguelId: id,
            usuarioId: usuario.sub,
            request: req,
            ...body,
        });
    }

    @ApiOperation({
        summary: 'Confirmar aluguel',
        description: 'Confirma um aluguel pendente.',
    })
    @ApiResponse({
        status: 200,
        description: 'Aluguel confirmado com sucesso.',
    })
    @ApiParam({ name: 'id', description: 'ID do aluguel' })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Post('aluguel/:id/confirmar')
    async confirmarAluguel(
        @Param('id') id: string,
        @usuarioAtual() usuario: UsuarioPayload,
        @Req() req: Request,
    ): Promise<void> {
        return await this.confirmarAluguelUseCase.execute({
            aluguelId: id,
            usuarioId: usuario.sub,
            request: req,
        });
    }
}
