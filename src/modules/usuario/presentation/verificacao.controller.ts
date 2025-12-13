import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnviarCodigoSMSUseCase } from '../application/usecases/verificacao/EnviarCodigoSMS.usecase';
import { VerificarCodigoSMSUseCase } from '../application/usecases/verificacao/VerificarCodigoSMS.usecase';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
    EnviarCodigoSMSDto,
    VerificarCodigoSMSDto,
} from '../application/dtos/verificacao-sms.dto';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import type { JwtPayload } from 'src/modules/auth/infra/services/jwt.service';
import {
    AuditarEnvioSms,
    AuditarVerificacaoSms,
    LimitarEnvioSMS,
    usuarioAtual,
} from 'src/common/decorators';

@ApiTags('verificacao')
@Controller('verificacao')
export class VerificacaoController {
    constructor(
        private readonly enviarCodigoSMSUseCase: EnviarCodigoSMSUseCase,
        private readonly verificarCodigoSMSUseCase: VerificarCodigoSMSUseCase,
    ) {}

    @ApiOperation({
        summary: 'Verificação de telefone via SMS',
        description: 'Enviar código de verificação via SMS',
    })
    @ApiResponse({
        status: 200,
        description: 'Código de verificação enviado com sucesso',
    })
    @ApiBody({ type: EnviarCodigoSMSDto })
    @ApiAccessToken()
    @AuditarEnvioSms()
    @LimitarEnvioSMS()
    @HttpCode(HttpStatus.OK)
    @Post('sms/enviar')
    async enviarCodigoSMS(@Body() props: EnviarCodigoSMSDto) {
        await this.enviarCodigoSMSUseCase.execute({
            telefone: props.telefone,
        });
    }

    @ApiOperation({
        summary: 'Verificação de código SMS',
        description: 'Verificar código de verificação recebido via SMS',
    })
    @ApiResponse({
        status: 200,
        description: 'Código de verificação verificado com sucesso',
    })
    @ApiBody({ type: VerificarCodigoSMSDto })
    @ApiAccessToken()
    @AuditarVerificacaoSms()
    @LimitarEnvioSMS()
    @HttpCode(HttpStatus.OK)
    @Post('sms/verificar')
    async verificarCodigoSMS(
        @usuarioAtual() usuario: JwtPayload,
        @Body() props: VerificarCodigoSMSDto,
    ) {
        await this.verificarCodigoSMSUseCase.execute({
            telefone: props.telefone,
            codigo: props.codigo,
            usuarioId: usuario.sub,
        });
    }
}
