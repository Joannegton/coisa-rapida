import {
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiConsumes,
} from '@nestjs/swagger';
import { EnviarCodigoSMSUseCase } from '../application/usecases/verificacao/enviar-codigo-sms.usecase';
import { VerificarCodigoSMSUseCase } from '../application/usecases/verificacao/verificar-codigo-sms.usecase';
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { EnviarComprovanteResidenciaDto } from '../application/dtos/comprovante-residencia.dto';
import { SalvarComprovanteResidenciaUseCase } from '../application/usecases/verificacao/salvar-comprovante-residencia.usecase';

@ApiTags('verificacao')
@Controller('verificacao')
export class VerificacaoController {
    constructor(
        private readonly enviarCodigoSMSUseCase: EnviarCodigoSMSUseCase,
        private readonly verificarCodigoSMSUseCase: VerificarCodigoSMSUseCase,
        private readonly salvarComprovanteResidenciaUseCase: SalvarComprovanteResidenciaUseCase,
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
    @Post('sms')
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

    @ApiOperation({
        summary: 'Verificação comprovante de residência',
        description: 'Enviar comprovante de residência para análise',
    })
    @ApiResponse({
        status: 200,
        description: 'Comprovante de residência enviado com sucesso',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: EnviarComprovanteResidenciaDto })
    @ApiAccessToken()
    @UseInterceptors(FileInterceptor('arquivo'))
    @HttpCode(HttpStatus.OK)
    @Post('comprovante-residencia')
    async enviarComprovanteResidencia(
        @usuarioAtual() usuario: JwtPayload,
        @UploadedFile() arquivo: Express.Multer.File,
        @Body() props: EnviarComprovanteResidenciaDto,
    ) {
        return await this.salvarComprovanteResidenciaUseCase.execute({
            usuarioId: usuario.sub,
            arquivo: arquivo,
            tipoComprovante: props.tipoComprovante,
            observacoesUsuario: props.observacoesUsuario,
        });
    }
}
