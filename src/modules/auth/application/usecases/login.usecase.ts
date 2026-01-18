import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../../infra/repositories/auth.repository';
import { BcryptService } from '../../infra/services/bcrypt.service';
import { JwtService } from '../../infra/services/jwt.service';
import { LoginDto } from '../dtos/login.dto';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { RefreshTokenRepository } from '../../infra/repositories/refresh-token.repository';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';

export type RequestData = {
    ip: string;
    userAgent?: string;
    method: string;
    rota: string;
};

@Injectable()
export class LoginUsecase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly bcryptService: BcryptService,
        private readonly authRepository: AuthRepository,
        private readonly auditoriaService: AuditoriaService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {}

    async execute(
        props: LoginDto,
        requestData?: RequestData,
    ): Promise<{
        access_token: string;
        refresh_token: string;
        expiresIn: number;
    }> {
        const inicioExecucao = Date.now();
        try {
            const usuarioAuth =
                await this.authRepository.buscarPorEmailComSenha(props.email);
            if (!usuarioAuth)
                throw new UnauthorizedException('Email ou senha inválidos');

            const senhaCorreta = await this.bcryptService.compararSenha(
                props.senha,
                usuarioAuth.hashSenha,
            );
            if (!senhaCorreta)
                throw new UnauthorizedException('Email ou senha inválidos');

            const usuario = await this.authRepository.buscarUsuarioPorAuthId(
                usuarioAuth.id,
            );
            if (!usuario)
                throw new UnauthorizedException('Usuário não encontrado');

            usuarioAuth.dataUltimoLogin = new Date();
            await this.authRepository.salvar(usuarioAuth);

            const { token: access_token, expiresIn } =
                await this.jwtService.gerarAccessToken(
                    usuario.id,
                    usuarioAuth.email,
                    usuarioAuth.role,
                );

            const payload = {
                sub: usuario.id,
                email: usuarioAuth.email,
                role: usuarioAuth.role,
            };

            const refreshTokenString =
                await this.jwtService.gerarRefreshToken(payload);

            const expiraEm = new Date();
            expiraEm.setDate(expiraEm.getDate() + 7);

            await this.refreshTokenRepository.revogarPorUsuario(usuarioAuth.id);

            await this.refreshTokenRepository.criar({
                token: refreshTokenString,
                usuarioAuthId: usuarioAuth.id,
                expiraEm,
            });

            const duracaoMs = Date.now() - inicioExecucao;

            if (requestData) {
                await this.auditoriaService.criar({
                    timestamp: new Date(),
                    usuarioId: usuario.id,
                    usuarioEmail: usuarioAuth.email,
                    modulo: 'auth',
                    acao: AuditoriaAcao.LOGIN,
                    recurso: 'auth',
                    descricao: 'Usuário realizou login no sistema',
                    nivel: 'medio',
                    metodo: requestData.method,
                    rota: requestData.rota,
                    ip: requestData.ip,
                    userAgent: requestData.userAgent,
                    statusCode: 200,
                    duracaoMs,
                });
            }

            return {
                access_token,
                refresh_token: refreshTokenString,
                expiresIn,
            };
        } catch (error) {
            const duracaoMs = Date.now() - inicioExecucao;

            if (requestData) {
                await this.auditoriaService.criar({
                    timestamp: new Date(),
                    usuarioId: 'desconhecido',
                    usuarioEmail: props.email,
                    modulo: 'auth',
                    acao: AuditoriaAcao.LOGIN,
                    recurso: 'tentativa_login',
                    descricao: 'Tentativa de login falhou',
                    nivel: 'medio',
                    metodo: requestData.method,
                    rota: requestData.rota,
                    ip: requestData.ip,
                    userAgent: requestData.userAgent,
                    statusCode: error.status || 401,
                    duracaoMs,
                    erro: error.message,
                });
            }

            throw error;
        }
    }
}
