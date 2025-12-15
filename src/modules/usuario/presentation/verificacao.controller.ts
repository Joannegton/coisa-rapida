import {
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiConsumes,
} from '@nestjs/swagger';
import { EnviarCodigoSMSUseCase } from '../application/usecases/verificacao/enviar-codigo-sms.usecase';
import { VerificarCodigoSMSUseCase } from '../application/usecases/verificacao/verificar-codigo-sms.usecase';
import { EnviarLinkVerificacaoEmailUseCase } from '../application/usecases/verificacao/enviar-link-verificacao-email.usecase';
import { VerificarLinkEmailUseCase } from '../application/usecases/verificacao/verificar-link-email.usecase';
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseInterceptors,
    UploadedFile,
    Get,
    Query,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    EnviarCodigoSMSDto,
    VerificarCodigoSMSDto,
} from '../application/dtos/verificacao/verificacao-sms.dto';
import { VerificarLinkEmailDto } from '../application/dtos/verificacao/verificacao-email.dto';
import { ApiAccessToken } from 'src/common/decorators/swagger.decorators';
import type { UsuarioPayload } from 'src/modules/auth/infra/services/jwt.service';
import {
    AuditarEnvioSms,
    AuditarVerificacaoSms,
    LimitarEnvioSMS,
    LimitarUpload,
    LimitarVerificacaoEmail,
    Publico,
    usuarioAtual,
} from 'src/common/decorators';
import { EnviarComprovanteResidenciaDto } from '../application/dtos/verificacao/comprovante-residencia.dto';
import { SalvarComprovanteResidenciaUseCase } from '../application/usecases/verificacao/salvar-comprovante-residencia.usecase';
import { TemplateService } from 'src/shared/infra/services/template.service';

@ApiTags('verificacao')
@Controller('verificacao')
export class VerificacaoController {
    constructor(
        private readonly enviarCodigoSMSUseCase: EnviarCodigoSMSUseCase,
        private readonly verificarCodigoSMSUseCase: VerificarCodigoSMSUseCase,
        private readonly enviarLinkVerificacaoEmailUseCase: EnviarLinkVerificacaoEmailUseCase,
        private readonly verificarLinkEmailUseCase: VerificarLinkEmailUseCase,
        private readonly salvarComprovanteResidenciaUseCase: SalvarComprovanteResidenciaUseCase,
        private readonly templateService: TemplateService,
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
        @usuarioAtual() usuario: UsuarioPayload,
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
    @LimitarUpload()
    @HttpCode(HttpStatus.OK)
    @Post('comprovante-residencia')
    async enviarComprovanteResidencia(
        @usuarioAtual() usuario: UsuarioPayload,
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

    @ApiOperation({
        summary: 'Enviar link de verificação de email',
        description: 'Enviar link de verificação por email (público)',
    })
    @ApiResponse({
        status: 200,
        description: 'Link enviado com sucesso',
    })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Post('email/enviar-link')
    async enviarLinkVerificacao(@usuarioAtual() usuario: UsuarioPayload) {
        return await this.enviarLinkVerificacaoEmailUseCase.execute(
            usuario.sub,
            usuario.email,
        );
    }

    @ApiOperation({
        summary: 'Página de verificação de email',
        description:
            'Página HTML que automaticamente verifica o email via link',
    })
    @ApiResponse({
        status: 200,
        description: 'Página de verificação de email exibida com sucesso',
    })
    @HttpCode(HttpStatus.OK)
    @Publico()
    @LimitarVerificacaoEmail()
    @Get('email/verificar')
    async verificarEmailPage(
        @Query('token') token: string,
        @Res() res: Response,
    ) {
        if (!token) {
            const html = this.templateService.renderizar(
                'page-erro-verificacao-email',
                {},
            );
            res.setHeader('Content-Type', 'text/html');
            return res.status(400).send(html);
        }

        const html = this.templateService.renderizar('page-email-verificacao', {
            API_URL: process.env.API_URL as string,
            TOKEN: token.replaceAll("'", String.raw`\'`),
        });

        res.setHeader('Content-Type', 'text/html');
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' 'self' https:; font-src 'self' https: data:; img-src 'self' https: data:;",
        );
        res.send(html);
    }

    @ApiOperation({
        summary: 'Verificar email via link',
        description: 'Endpoint público para clicar no link de verificação',
    })
    @ApiResponse({
        status: 200,
        description: 'Email verificado com sucesso',
    })
    @Publico()
    @LimitarVerificacaoEmail()
    @HttpCode(HttpStatus.OK)
    @Post('email/verificar')
    async verificarLink(@Body() props: VerificarLinkEmailDto) {
        return await this.verificarLinkEmailUseCase.execute(props);
    }
}
