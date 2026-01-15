import {
    Body,
    Controller,
    Post,
    Get,
    Param,
    Logger,
    HttpCode,
    HttpStatus,
    Headers,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CriarPreferenciaPagamentoUsecase } from './application/usecases/CriarPreferenciaPagamento.usecase';
import { ProcessarWebhookPagamentoUsecase } from './application/usecases/ProcessarWebhookPagamento.usecase';
import { PreferenciaPagamentoResponseDto } from './application/dtos/preferencia-pagamento-response.dto';
import { Publico } from 'src/common/decorators/public.decorator';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import { usuarioAtual } from 'src/common/decorators/usuario-atual.decorator';

@ApiTags('pagamento')
@Controller('pagamento')
export class PagamentoController {
    private readonly logger = new Logger(PagamentoController.name);

    constructor(
        private readonly criarPreferenciaPagamentoUsecase: CriarPreferenciaPagamentoUsecase,
        private readonly processarWebhookPagamentoUsecase: ProcessarWebhookPagamentoUsecase,
    ) {}

    @ApiOperation({
        summary: 'Webhook do Mercado Pago',
        description:
            'Recebe notificações do Mercado Pago sobre mudanças de status de pagamento',
    })
    @Publico()
    @HttpCode(HttpStatus.OK)
    @Post('webhook')
    async webhook(
        @Body() body: any,
        @Headers('x-signature') signature?: string,
        @Headers('x-request-id') requestId?: string,
        @Query() query?: Record<string, string>,
    ) {
        const dataId =
            query?.['data.id'] || query?.['id'] || body.data?.id || body.id;

        return await this.processarWebhookPagamentoUsecase.execute({
            signature,
            requestId,
            dataId,
            body,
        });
    }

    @ApiOperation({
        summary: 'Criar preferência de pagamento',
        description:
            'Cria uma preferência de pagamento no Mercado Pago para um aluguel específico',
    })
    @ApiResponse({
        status: 201,
        description: 'Preferência de pagamento criada com sucesso',
        type: PreferenciaPagamentoResponseDto,
    })
    @ApiParam({
        name: 'aluguelId',
        description:
            'ID do aluguel para o qual criar a preferência de pagamento',
        example: 'uuid-do-aluguel',
    })
    @ApiAccessToken()
    @HttpCode(HttpStatus.CREATED)
    @Post(':aluguelId')
    async criarPreferencia(
        @usuarioAtual() usuario: UsuarioPayload,
        @Param('aluguelId') aluguelId: string,
    ) {
        return await this.criarPreferenciaPagamentoUsecase.execute({
            aluguelId,
            usuarioId: usuario.sub,
            usuarioEmail: usuario.email,
        });
    }
}
