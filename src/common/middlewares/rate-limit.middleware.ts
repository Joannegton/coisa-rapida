import {
    Injectable,
    NestMiddleware,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../../shared/services/cache.service';
import { AuditoriaService } from '../../shared/services/auditoria.service';
import { IpUtils } from '../../shared/utils/ip.utils';

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
    private readonly maxRequisicoes = 100;
    private readonly duracaoBloqueio = 5 * 60 * 1000;

    constructor(
        private readonly cacheService: CacheService,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        const ip = IpUtils.obterIpCliente(req);
        const agora = Date.now();
        const chaveContador = `rate-limit:ip:${ip}`;
        const chaveBloqueio = `rate-limit:ip:${ip}:bloqueio`;

        const bloqueio = await this.cacheService.obter<{ ate: number }>(
            chaveBloqueio,
        );
        if (bloqueio && agora < bloqueio.ate) {
            const tentarNovamenteEm = Math.ceil((bloqueio.ate - agora) / 1000);
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

        const tentativas = await this.cacheService.incrementar(
            chaveContador,
            60,
        ); // 60 segundos TTL

        // Verificar se excedeu o limite
        if (tentativas > this.maxRequisicoes) {
            // Bloquear por 5 minutos
            const ate = agora + this.duracaoBloqueio;
            await this.cacheService.definir(chaveBloqueio, { ate }, 300); // 5 minutos TTL

            const tentarNovamenteEm = Math.ceil(this.duracaoBloqueio / 1000);

            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: 'desconhecido',
                modulo: 'rate-limit',
                acao: 'limite_excedido',
                recurso: 'rate-limit',
                descricao: `IP bloqueado por exceder limite de ${this.maxRequisicoes} requisições/minuto`,
                nivel: 'critico',
                metodo: req.method,
                rota: req.url,
                ip: IpUtils.normalizarIp(ip),
                userAgent: req.headers['user-agent'],
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                erro: `Rate limit excedido. ${tentativas} tentativas em 60 segundos.`,
            });

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

        this.definirCabecalhosRateLimit(res, tentativas);
        next();
    }

    private definirCabecalhosRateLimit(
        res: Response,
        tentativas: number,
    ): void {
        res.setHeader('X-RateLimit-Limit', this.maxRequisicoes);
        res.setHeader(
            'X-RateLimit-Remaining',
            Math.max(0, this.maxRequisicoes - tentativas),
        );
        res.setHeader(
            'X-RateLimit-Reset',
            Math.ceil((Date.now() + 60000) / 1000),
        );
    }
}
