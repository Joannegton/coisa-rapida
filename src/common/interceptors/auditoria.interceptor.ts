import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AUDITORIA_KEY } from '../decorators/auditoria.decorator';
import { AuditoriaService } from '../services/auditoria.service';

interface MetadadosAuditoria {
    acao: string;
    recurso: string;
    descricao?: string;
    nivel?: 'baixo' | 'medio' | 'alto' | 'critico';
}

interface LogAuditoria {
    id?: string;
    timestamp: Date;
    usuarioId: string;
    usuarioEmail?: string;
    acao: string;
    recurso: string;
    recursoId?: string;
    descricao?: string;
    nivel: 'baixo' | 'medio' | 'alto' | 'critico';
    metodo: string;
    rota: string;
    ip: string;
    userAgent?: string;
    statusCode?: number;
    duracaoMs?: number;
    erro?: string;
}

/**
 * Interceptor que registra logs de auditoria (técnico/infraestrutura).
 *
 *  * Registra:
 * - Quem (usuário)
 * - O quê (ação)
 * - Quando (timestamp)
 * - Onde (rota, IP)
 * - Resultado (sucesso/erro, duração)
 *
 * @example
 * @Auditar('criar_aluguel', 'aluguel', { nivel: 'medio' })
 * async criar() {}
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
    private readonly logger = new Logger('Auditoria');

    constructor(
        private readonly reflector: Reflector,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const metadados = this.reflector.getAllAndOverride<MetadadosAuditoria>(
            AUDITORIA_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!metadados) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const usuario = request.usuario;

        if (!usuario) {
            return next.handle();
        }

        const inicioExecucao = Date.now();

        const logBase: LogAuditoria = {
            timestamp: new Date(),
            usuarioId: usuario.sub,
            usuarioEmail: usuario.email,
            acao: metadados.acao,
            recurso: metadados.recurso,
            recursoId: request.params?.id || request.body?.id,
            descricao: metadados.descricao,
            nivel: metadados.nivel || 'baixo',
            metodo: request.method,
            rota: request.route?.path || request.url,
            ip: this.obterIp(request),
            userAgent: request.headers['user-agent'],
        };

        return next.handle().pipe(
            tap(() => {
                // Sucesso
                const duracaoMs = Date.now() - inicioExecucao;

                const log: LogAuditoria = {
                    ...logBase,
                    statusCode: response.statusCode,
                    duracaoMs,
                };

                // Fire-and-forget: não bloqueia a resposta
                this.registrarLog(log).catch((err) =>
                    this.logger.error(
                        'Erro ao registrar log de auditoria',
                        err,
                    ),
                );
            }),
            catchError((erro) => {
                // Erro
                const duracaoMs = Date.now() - inicioExecucao;

                const log: LogAuditoria = {
                    ...logBase,
                    statusCode: erro.status || 500,
                    duracaoMs,
                    erro: erro.message || 'Erro desconhecido',
                };

                // Fire-and-forget: não bloqueia a resposta
                this.registrarLog(log).catch((err) =>
                    this.logger.error(
                        'Erro ao registrar log de auditoria',
                        err,
                    ),
                );

                throw erro;
            }),
        );
    }

    private async registrarLog(log: LogAuditoria): Promise<void> {
        await this.auditoriaService.criar(log);

        const emoji = this.obterEmojiNivel(log.nivel);

        const recursoInfo = log.recursoId
            ? `${log.recurso} (${log.recursoId})`
            : log.recurso;
        const mensagem = [
            `${emoji} [${log.nivel.toUpperCase()}]`,
            `Usuário: ${log.usuarioEmail || log.usuarioId}`,
            `Ação: ${log.acao}`,
            `Recurso: ${recursoInfo}`,
            log.descricao ? `Descrição: ${log.descricao}` : '',
            `Status: ${log.statusCode}`,
            `Duração: ${log.duracaoMs}ms`,
            log.erro ? `Erro: ${log.erro}` : '',
        ]
            .filter(Boolean)
            .join(' | ');

        switch (log.nivel) {
            case 'critico':
                this.logger.error(mensagem);
                break;
            case 'alto':
                this.logger.warn(mensagem);
                break;
            case 'medio':
                this.logger.log(mensagem);
                break;
            default:
                this.logger.debug(mensagem);
        }
    }

    private obterIp(request: any): string {
        return (
            request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            'unknown'
        );
    }

    private obterEmojiNivel(nivel: string): string {
        const emojis: Record<string, string> = {
            baixo: '📝',
            medio: '📋',
            alto: '⚠️',
            critico: '🚨',
        };
        return emojis[nivel] || '📝';
    }
}
