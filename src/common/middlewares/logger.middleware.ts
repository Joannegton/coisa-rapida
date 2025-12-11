import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de logging de requisições HTTP.
 *
 * Registra informações essenciais de cada request para:
 * - Debug e troubleshooting
 * - Monitoramento de performance
 * - Análise de tráfego
 *
 * Logs incluem: método, rota, status, tempo de resposta, IP
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction): void {
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('user-agent') || '';
        const tempoInicio = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const tamanhoConteudo = res.get('content-length') || 0;
            const duracao = Date.now() - tempoInicio;

            const corStatus = this.obterCorStatus(statusCode);

            this.logger.log(
                `${method} ${originalUrl} ${corStatus}${statusCode}\x1b[0m ${duracao}ms - ${tamanhoConteudo} bytes - ${ip} - ${userAgent.substring(0, 50)}`,
            );

            // Log de warning para requests lentas (> 3s)
            if (duracao > 3000) {
                this.logger.warn(
                    `Slow request: ${method} ${originalUrl} took ${duracao}ms`,
                );
            }
        });

        next();
    }

    private obterCorStatus(status: number): string {
        if (status >= 500) return '\x1b[31m'; // Vermelho - Erro servidor
        if (status >= 400) return '\x1b[33m'; // Amarelo - Erro cliente
        if (status >= 300) return '\x1b[36m'; // Ciano - Redirecionamento
        if (status >= 200) return '\x1b[32m'; // Verde - Sucesso
        return '\x1b[0m';
    }
}
