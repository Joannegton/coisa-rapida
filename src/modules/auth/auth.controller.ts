import { Body, Controller, Post, Req, Get } from '@nestjs/common';
import { RegistrarUsecase } from './application/usecases/registrar.usecase';
import { RegistrarDto } from './application/dtos/registrar.dto';
import { Publico } from 'src/common/decorators/public.decorator';
import type { JwtPayload } from 'src/modules/auth/jwt.strategy';
import { Auditar, LimitadorUsuario, usuarioAtual } from 'src/common/decorators';
import { LoginUsecase } from './application/usecases/login.usecase';
import { LoginDto } from './application/dtos/login.dto';
import { IpUtils } from 'src/shared/utils/ip.utils';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly registrarUsecase: RegistrarUsecase,
        private readonly loginUsecase: LoginUsecase,
    ) {}

    @Publico()
    @LimitadorUsuario(3, 10, {
        mensagem: 'Muitas tentativas de login. Tente novamente mais tarde.',
    })
    @Post()
    async login(@Body() props: LoginDto, @Req() request: Request) {
        const requestData = {
            ip: IpUtils.normalizarIp(IpUtils.obterIpCliente(request)),
            userAgent: request.headers['user-agent'],
            method: request.method,
            rota: request.route?.path || request.url,
        };
        return await this.loginUsecase.execute(props, requestData);
    }

    @Publico()
    @Auditar('registro_usuario', 'auth', {
        descricao: 'Novo usuário se registrou',
        nivel: 'medio',
    })
    @Post('registrar')
    async registrar(@Body() props: RegistrarDto, @Req() request: Request) {
        const requestData = {
            ip: IpUtils.normalizarIp(IpUtils.obterIpCliente(request)),
            userAgent: request.headers['user-agent'],
            method: request.method,
            rota: request.route?.path || request.url,
        };
        return await this.registrarUsecase.execute(props, requestData);
    }

    @Get('me')
    async me(@usuarioAtual() usuario: JwtPayload) {
        return {
            usuarioId: usuario.sub,
            email: usuario.email,
            mensagem: 'Você está autenticado!',
        };
    }
}
