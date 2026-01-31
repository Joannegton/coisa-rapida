import {
    Body,
    Controller,
    Post,
    Req,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
    Res,
} from '@nestjs/common';
import express from 'express';
import { RegistrarUsecase } from './application/usecases/registrar.usecase';
import { RegistrarDto } from './application/dtos/registrar.dto';
import { Publico } from 'src/common/decorators/public.decorator';
import type { UsuarioPayload } from './infra/services/jwt.service';
import {
    LimitadorUsuario,
    LimitarResetSenha,
    usuarioAtual,
} from 'src/common/decorators';
import { LoginUsecase } from './application/usecases/login.usecase';
import { LoginDto } from './application/dtos/login.dto';
import { Utils } from 'src/shared/utils/utils';
import type { Request } from 'express';
import { RefreshTokenUsecase } from './application/usecases/refresh-token.usecase';
import { RevogarTokenUsecase } from './application/usecases/revogar-token.usecase';
import { ValidarCodigoRecuperacaoUsecase } from './application/usecases/validar-codigo-recuperacao.usecase';
import { ValidarCodigoDto } from './application/dtos/validar-codigo.dto';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
    ApiAccessToken,
    ApiRefreshToken,
} from 'src/common/decorators/swagger.decorators';
import { SolicitarRecuperacaoSenhaUsecase } from './application/usecases/solicitar-recuperacao-senha.usecase';
import { ResetarSenhaUsecase } from './application/usecases/resetar-senha.usecase';
import { SolicitarRecuperarSenhaDto } from './application/dtos/solicitar-recuperar-senha.dto';
import { ResetarSenhaDto } from './application/dtos/resetar-senha.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly registrarUsecase: RegistrarUsecase,
        private readonly loginUsecase: LoginUsecase,
        private readonly refreshTokenUsecase: RefreshTokenUsecase,
        private readonly revogarTokenUsecase: RevogarTokenUsecase,
        private readonly solicitarRecuperacaoSenhaUsecase: SolicitarRecuperacaoSenhaUsecase,
        private readonly resetarSenhaUsecase: ResetarSenhaUsecase,
        private readonly validarCodigoRecuperacaoUsecase: ValidarCodigoRecuperacaoUsecase,
    ) {}

    @ApiOperation({
        summary: 'Login de usuário',
        description: 'Autentica o usuário e retorna um token JWT.',
    })
    @ApiResponse({
        status: 200,
        description: 'Login bem-sucedido, retorna token.',
        example: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'dGhpc0lzQXJlZnJlc2hUb2tlbg==',
            expiresIn: 900,
        },
    })
    @ApiBody({ type: LoginDto })
    @Publico()
    @LimitadorUsuario(3, 10, {
        mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.',
    })
    @HttpCode(HttpStatus.OK)
    @Post()
    async login(
        @Body() props: LoginDto,
        @Req() request: Request,
        @Res() response: express.Response,
    ) {
        const requestData = {
            ip: Utils.normalizarIp(Utils.obterIpCliente(request)),
            userAgent: request.headers['user-agent'],
            method: request.method,
            rota: request.route?.path || request.url,
        };

        const loginResult = await this.loginUsecase.execute(props, requestData);
        const authResponse = this.setAuthCookiesERetornaTokens(
            response,
            loginResult.access_token,
            loginResult.refresh_token,
        );

        response.json(authResponse);
    }

    @ApiOperation({
        summary: 'Registro de usuário',
        description: 'Cria uma nova conta de usuário.',
    })
    @ApiResponse({
        status: 201,
        description: 'Usuário registrado com sucesso, retorna token.',
        example: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'dGhpc0lzQXJlZnJlc2hUb2tlbg==',
            expiresIn: 900,
        },
    })
    @ApiBody({ type: RegistrarDto })
    @Publico()
    @HttpCode(HttpStatus.CREATED)
    @Post('registrar')
    async registrar(
        @Body() props: RegistrarDto,
        @Req() request: Request,
        @Res() response: express.Response,
    ) {
        const requestData = {
            ip: Utils.normalizarIp(Utils.obterIpCliente(request)),
            userAgent: request.headers['user-agent'],
            method: request.method,
            rota: request.route?.path || request.url,
        };

        const registrarResult = await this.registrarUsecase.execute(
            props,
            requestData,
        );
        const authResponse = this.setAuthCookiesERetornaTokens(
            response,
            registrarResult.access_token,
            registrarResult.refresh_token,
        );

        response.json(authResponse);
    }

    @ApiOperation({
        summary: 'Obter dados do usuário atual',
        description: 'Retorna informações do usuário autenticado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Dados do usuário retornados.',
        example: {
            usuarioId: 'f72f4535-061e-41f5-a6d4-d224ab2d1795',
            email: 'usuario@example.com',
            role: 'USER',
        },
    })
    @ApiAccessToken()
    @HttpCode(HttpStatus.OK)
    @Get('me')
    async me(@usuarioAtual() usuario: UsuarioPayload) {
        return {
            usuarioId: usuario.sub,
            email: usuario.email,
            role: usuario.role,
        };
    }

    @ApiOperation({
        summary: 'Atualizar token de acesso',
        description: 'Gera um novo token de acesso usando o refresh token.',
    })
    @ApiResponse({
        status: 200,
        description: 'Novo token gerado.',
        example: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresIn: 900,
        },
    })
    @ApiRefreshToken()
    @Publico() // usado para pular o guard global de auth
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    @Post('atualizar-token')
    async atualizarToken(
        @Req() request: Request,
        @Res() response: express.Response,
    ) {
        const refreshToken = (request as any).refreshToken;

        const tokenResult =
            await this.refreshTokenUsecase.execute(refreshToken);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 15 * 60 * 1000, // 15 minutos
            path: '/',
        };
        response.cookie('access_token', tokenResult.accessToken, cookieOptions);

        response.json({
            access_token: tokenResult.accessToken,
            expiresIn: tokenResult.expiresIn,
        });
    }

    @ApiOperation({
        summary: 'Logout do usuário',
        description: 'Revoga o refresh token fornecido.',
    })
    @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
    @ApiRefreshToken()
    @Publico() // usado para pular o guard global de auth
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Req() request: Request, @Res() response: express.Response) {
        const token = (request as any).refreshToken;

        if (token) {
            await this.revogarTokenUsecase.execute(token);
        }

        response.clearCookie('access_token', { path: '/' });
        response.clearCookie('refresh_token', { path: '/' });

        response.json({ message: 'Logout realizado com sucesso' });
    }

    @ApiOperation({
        summary: 'Solicitar recuperação de senha',
        description:
            'Envia um email de recuperação de senha se o email existir.',
    })
    @ApiResponse({
        status: 200,
        description: 'Email enviado (ou não, se email não existir).',
        example: { codigoRecuperacao: '123456' },
    })
    @ApiBody({ type: SolicitarRecuperarSenhaDto })
    @Publico()
    @LimitarResetSenha()
    @HttpCode(HttpStatus.OK)
    @Post('solicitar-recuperacao-senha')
    async solicitarRecuperacaoSenha(@Body() props: SolicitarRecuperarSenhaDto) {
        const codigo = await this.solicitarRecuperacaoSenhaUsecase.execute(
            props.email,
        );
        return {
            codigoRecuperacao: codigo,
        };
    }

    @ApiOperation({
        summary: 'Validar código de recuperação',
        description:
            'Verifica se o código de recuperação é válido para o email.',
    })
    @ApiResponse({
        status: 200,
        description: 'Código válido.',
        example: { tokenTemporario: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    })
    @ApiBody({ type: ValidarCodigoDto })
    @Publico()
    @LimitarResetSenha()
    @HttpCode(HttpStatus.OK)
    @Post('validar-codigo')
    async validarCodigo(@Body() props: ValidarCodigoDto) {
        return await this.validarCodigoRecuperacaoUsecase.execute(
            props.email,
            props.codigo,
        );
    }

    @ApiOperation({
        summary: 'Resetar senha',
        description: 'Altera a senha do usuário usando o token de recuperação.',
    })
    @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
    @ApiBody({ type: ResetarSenhaDto })
    @Publico()
    @LimitarResetSenha()
    @HttpCode(HttpStatus.OK)
    @Post('resetar-senha')
    async resetarSenha(@Body() props: ResetarSenhaDto) {
        return await this.resetarSenhaUsecase.execute(
            props.tokenTemporario,
            props.novaSenha,
        );
    }

    private setAuthCookiesERetornaTokens(
        response: express.Response,
        accessToken: string,
        refreshToken: string,
    ) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 15 * 60 * 1000, // 15 minutos
            path: '/',
        };

        response.cookie('access_token', accessToken, cookieOptions);
        response.cookie('refresh_token', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expiresIn: 900,
        };
    }
}
