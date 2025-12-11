import {
    Injectable,
    NestMiddleware,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RegistroRequisicao {
    contagem: number;
    tempoReset: number;
    bloqueado: boolean;
    bloqueadoAte?: number;
}

/**
 * Middleware de Rate Limiting global por IP.
 *
 * este middleware protege contra:
 * - DDoS básico
 * - Ataques de força bruta em rotas públicas (login, registro)
 * - Abuso de API por IPs não autenticados
 *
 * Configurações padrão:
 * - 100 requests por minuto por IP
 * - Bloqueio de 5 minutos após exceder limite
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    // Armazena contagem de requests por IP (em produção, usar Redis)
    private readonly requisicoes = new Map<string, RegistroRequisicao>();

    private readonly janelaMs = 60 * 1000;
    private readonly maxRequisicoes = 100;
    private readonly duracaoBloqueio = 5 * 60 * 1000;

    use(req: Request, res: Response, next: NextFunction): void {
        const ip = this.obterIpCliente(req);
        const agora = Date.now();

        let registro = this.requisicoes.get(ip);

        if (!registro || agora > registro.tempoReset) {
            registro = {
                contagem: 1,
                tempoReset: agora + this.janelaMs,
                bloqueado: false,
            };
            this.requisicoes.set(ip, registro);
            this.definirCabecalhosRateLimit(res, registro);
            return next();
        }

        if (
            registro.bloqueado &&
            registro.bloqueadoAte &&
            agora < registro.bloqueadoAte
        ) {
            const tentarNovamenteEm = Math.ceil((registro.bloqueadoAte - agora) / 1000);
            res.setHeader('Retry-After', tentarNovamenteEm);
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Muitas requisições. Tente novamente em ${tentarNovamenteEm} segundos.`,
                    error: 'Too Many Requests',
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        if (
            registro.bloqueado &&
            registro.bloqueadoAte &&
            agora >= registro.bloqueadoAte
        ) {
            registro.bloqueado = false;
            registro.bloqueadoAte = undefined;
            registro.contagem = 1;
            registro.tempoReset = agora + this.janelaMs;
        }

        registro.contagem++;

        if (registro.contagem > this.maxRequisicoes) {
            registro.bloqueado = true;
            registro.bloqueadoAte = agora + this.duracaoBloqueio;

            const tentarNovamenteEm = Math.ceil(this.duracaoBloqueio / 1000);
            res.setHeader('Retry-After', tentarNovamenteEm);

            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Limite de requisições excedido. Bloqueado por ${tentarNovamenteEm / 60} minutos.`,
                    error: 'Too Many Requests',
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        this.definirCabecalhosRateLimit(res, registro);
        next();
    }

    private obterIpCliente(req: Request): string {
        // Suporta proxies (Heroku, AWS, etc)
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket.remoteAddress || 'unknown';
    }

    /**
     * Define os headers padrão de rate limiting
     */
    private definirCabecalhosRateLimit(res: Response, registro: RegistroRequisicao): void {
        res.setHeader('X-RateLimit-Limit', this.maxRequisicoes);
        res.setHeader(
            'X-RateLimit-Remaining',
            Math.max(0, this.maxRequisicoes - registro.contagem),
        );
        res.setHeader('X-RateLimit-Reset', Math.ceil(registro.tempoReset / 1000));
    }
}
