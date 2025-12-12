import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../../infra/repositories/auth.repository';
import { BcryptService } from '../../infra/services/bcrypt.service';
import { JwtService } from '../../infra/services/jwt.service';
import { LoginDto } from '../dtos/login.dto';
import { AuditoriaService } from 'src/shared/services';

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
    ) {}

    async execute(
        props: LoginDto,
        requestData?: RequestData,
    ): Promise<{
        access_token: string;
    }> {
        const inicioExecucao = Date.now();
        try {
            const usuarioAuth =
                await this.authRepository.buscarPorEmailComSenha(props.email);
            if (!usuarioAuth)
                throw new UnauthorizedException('Credenciais Inválidas');

            const senhaCorreta = await this.bcryptService.compararSenha(
                props.senha,
                usuarioAuth.hashSenha,
            );
            if (!senhaCorreta)
                throw new UnauthorizedException('Credenciais Inválidas');

            const usuario = await this.authRepository.buscarUsuarioPorAuthId(
                usuarioAuth.id,
            );
            if (!usuario)
                throw new UnauthorizedException('Usuário não encontrado');

            usuarioAuth.dataUltimoLogin = new Date();
            await this.authRepository.salvar(usuarioAuth);

            const access_token = await this.jwtService.gerarAccessToken(
                usuario.id,
                usuarioAuth.email,
            );

            const duracaoMs = Date.now() - inicioExecucao;

            // Auditoria para login bem-sucedido
            if (requestData) {
                await this.auditoriaService.criar({
                    timestamp: new Date(),
                    usuarioId: usuario.id,
                    usuarioEmail: usuarioAuth.email,
                    modulo: 'auth',
                    acao: 'login',
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
            };
        } catch (error) {
            const duracaoMs = Date.now() - inicioExecucao;

            // Auditoria para tentativa de login falhada
            if (requestData) {
                await this.auditoriaService.criar({
                    timestamp: new Date(),
                    usuarioId: 'desconhecido',
                    usuarioEmail: props.email,
                    modulo: 'auth',
                    acao: 'tentativa_login',
                    recurso: 'auth',
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
