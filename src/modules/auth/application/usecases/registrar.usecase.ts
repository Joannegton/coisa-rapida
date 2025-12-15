import { ConflictException, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { AuthRepository } from '../../infra/repositories/auth.repository';
import { BcryptService } from '../../infra/services/bcrypt.service';
import { JwtService } from '../../infra/services/jwt.service';
import { RegistrarDto } from '../dtos/registrar.dto';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { RefreshTokenRepository } from '../../infra/repositories/refresh-token.repository';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { UsuarioRegistradoEvent } from '../events/usuario-registrado';

@Injectable()
export class RegistrarUsecase {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly bcryptService: BcryptService,
        private readonly jwtService: JwtService,
        private readonly auditoriaService: AuditoriaService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(
        dto: RegistrarDto,
        requestData?: {
            ip: string;
            userAgent?: string;
            method: string;
            rota: string;
        },
    ): Promise<{
        access_token: string;
        refresh_token: string;
    }> {
        const inicioExecucao = Date.now();
        try {
            const usuarioExistentePromise = this.authRepository.buscarPorEmail(
                dto.email,
            );
            const usuarioCpfExistentePromise =
                this.authRepository.buscarUsuarioPorCpf(dto.cpf);

            const [usuarioExistenteResult, usuarioCpfExistenteResult] =
                await Promise.all([
                    usuarioExistentePromise,
                    usuarioCpfExistentePromise,
                ]);

            if (usuarioExistenteResult) {
                throw new ConflictException('Email já cadastrado');
            }

            if (usuarioCpfExistenteResult) {
                throw new ConflictException('CPF já cadastrado');
            }

            const hashSenha = await this.bcryptService.hashSenha(dto.senha);

            const { usuarioAuth, usuario } =
                await this.authRepository.registrarUsuarioAtomico({
                    email: dto.email,
                    hashSenha,
                    nome: dto.nome,
                    cpf: dto.cpf,
                });

            const accessToken = await this.jwtService.gerarAccessToken(
                usuario.id,
                usuarioAuth.email,
                usuarioAuth.role,
            );

            const refreshTokenString = await this.jwtService.gerarRefreshToken({
                sub: usuarioAuth.id,
                email: usuarioAuth.email,
                role: usuarioAuth.role,
            });

            const expiraEm = new Date();
            expiraEm.setDate(expiraEm.getDate() + 7);

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
                    acao: AuditoriaAcao.REGISTRAR_USUARIO,
                    recurso: 'registro_usuario',
                    descricao: 'Novo usuário se registrou',
                    nivel: 'medio',
                    metodo: requestData.method,
                    rota: requestData.rota,
                    ip: requestData.ip,
                    userAgent: requestData.userAgent,
                    statusCode: 201,
                    duracaoMs,
                });
            }

            this.eventBus.publish(
                new UsuarioRegistradoEvent(
                    usuario.id,
                    usuarioAuth.email,
                    usuario.nome,
                ),
            );

            return {
                access_token: accessToken,
                refresh_token: refreshTokenString,
            };
        } catch (error) {
            const duracaoMs = Date.now() - inicioExecucao;

            if (requestData) {
                await this.auditoriaService.criar({
                    timestamp: new Date(),
                    usuarioId: 'desconhecido',
                    usuarioEmail: dto.email,
                    modulo: 'auth',
                    acao: AuditoriaAcao.REGISTRAR_USUARIO,
                    recurso: 'tentativa_registro',
                    descricao: 'Tentativa de registro falhou',
                    nivel: 'medio',
                    metodo: requestData.method,
                    rota: requestData.rota,
                    ip: requestData.ip,
                    userAgent: requestData.userAgent,
                    statusCode: error.status || 409,
                    duracaoMs,
                    erro: error.message,
                });
            }

            throw error;
        }
    }
}
