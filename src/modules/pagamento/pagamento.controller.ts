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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiHeader,
} from '@nestjs/swagger';
import { CriarPreferenciaPagamentoUsecase } from './application/usecases/CriarPreferenciaPagamento.usecase';
import { ProcessarWebhookPagamentoUsecase } from './application/usecases/ProcessarWebhookPagamento.usecase';
import { PreferenciaPagamentoResponseDto } from './application/dtos/preferencia-pagamento-response.dto';
import { Publico, usuarioAtual } from 'src/common/decorators';
import type { UsuarioPayload } from '../auth/infra/services/jwt.service';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';

@ApiTags('pagamento')
@Controller('pagamento')
export class PagamentoController {
    private readonly logger = new Logger(PagamentoController.name);

    constructor(
        private readonly criarPreferenciaPagamentoUsecase: CriarPreferenciaPagamentoUsecase,
        private readonly processarWebhookPagamentoUsecase: ProcessarWebhookPagamentoUsecase,
    ) {}

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

    @Get(':pagamentoId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Obter detalhes do pagamento',
        description: 'Retorna os detalhes de um pagamento específico',
    })
    @ApiParam({
        name: 'pagamentoId',
        description: 'ID do pagamento',
        example: 'uuid-do-pagamento',
    })
    @ApiResponse({
        status: 200,
        description: 'Detalhes do pagamento retornados com sucesso',
        schema: {
            type: 'object',
            properties: {
                sucesso: { type: 'boolean', example: true },
                dados: {
                    type: 'object',
                    properties: {
                        pagamentoId: { type: 'string' },
                        mensagem: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 404,
        description: 'Pagamento não encontrado',
    })
    @ApiResponse({
        status: 500,
        description: 'Erro interno do servidor',
    })
    async obterPagamento(@Param('pagamentoId') pagamentoId: string) {
        this.logger.log(
            `Recebida requisição para obter detalhes do pagamento ${pagamentoId}`,
        );

        try {
            // TODO: Implementar usecase de buscar pagamento
            return {
                sucesso: true,
                dados: {
                    pagamentoId,
                    mensagem: 'Busca de pagamento não implementada ainda',
                },
            };
        } catch (error) {
            this.logger.error('Erro ao obter pagamento', error.stack);
            throw error;
        }
    }

    @ApiOperation({
        summary: 'Webhook do Mercado Pago',
        description:
            'Recebe notificações do Mercado Pago sobre mudanças de status de pagamento',
    })
    @ApiHeader({
        name: 'x-signature',
        description: 'Assinatura HMAC SHA256 para validação da autenticidade',
        required: false,
    })
    @ApiHeader({
        name: 'x-request-id',
        description: 'ID único da requisição',
        required: false,
    })
    @ApiBody({
        type: Object,
        description: 'Dados do webhook do Mercado Pago',
        schema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: 'Tipo do evento',
                    example: 'payment',
                },
                data: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'ID do pagamento',
                            example: '123456789',
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Webhook processado com sucesso',
        schema: {
            type: 'object',
            properties: {
                sucesso: { type: 'boolean', example: true },
                dados: { type: 'object' },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Erro ao processar webhook (não bloqueia Mercado Pago)',
        schema: {
            type: 'object',
            properties: {
                sucesso: { type: 'boolean', example: false },
                mensagem: {
                    type: 'string',
                    example: 'Erro ao processar webhook',
                },
            },
        },
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
        this.logger.log('Webhook do Mercado Pago recebido');

        try {
            const dataId =
                query?.['data.id'] || query?.['id'] || body.data?.id || body.id;

            const resultado =
                await this.processarWebhookPagamentoUsecase.execute({
                    signature,
                    requestId,
                    dataId,
                    body,
                });

            return {
                sucesso: true,
                dados: resultado,
            };
        } catch (error) {
            this.logger.error('Erro ao processar webhook', error.stack);
            // Não lançar erro para não bloquear o Mercado Pago
            // Apenas logar o erro
            return {
                sucesso: false,
                mensagem: 'Erro ao processar webhook',
            };
        }
    }
}
