import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private readonly redisClient: RedisClientType;

    constructor() {
        this.redisClient = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
            },
            password: process.env.REDIS_PASSWORD,
        });

        this.redisClient.on('error', (err) => {
            this.logger.error('Erro no Redis:', err);
        });
    }

    async onModuleInit() {
        await this.redisClient.connect();
        this.logger.log('Conectado ao Redis');
    }

    async onModuleDestroy() {
        await this.redisClient.disconnect();
        this.logger.log('Desconectado do Redis');
    }

    async definir(
        chave: string,
        valor: any,
        ttlSegundos: number,
    ): Promise<void> {
        await this.redisClient.setEx(chave, ttlSegundos, JSON.stringify(valor));
    }

    async obter<T = any>(chave: string): Promise<T | null> {
        const valor = await this.redisClient.get(chave);
        if (!valor) {
            return null;
        }
        return JSON.parse(valor) as T;
    }

    async incrementar(chave: string, ttlSegundos: number): Promise<number> {
        const novoValor = await this.redisClient.incr(chave);
        await this.redisClient.expire(chave, ttlSegundos);
        return novoValor;
    }

    async decrementar(chave: string): Promise<number> {
        const novoValor = await this.redisClient.decr(chave);
        // Se chegou a 0, remover
        if (novoValor <= 0) {
            await this.redisClient.del(chave);
            return 0;
        }
        return novoValor;
    }

    async remover(chave: string): Promise<void> {
        await this.redisClient.del(chave);
    }

    async removerPorPrefixo(prefixo: string): Promise<number> {
        const chaves = await this.redisClient.keys(`${prefixo}*`);
        if (chaves.length > 0) {
            return await this.redisClient.del(chaves);
        }
        return 0;
    }

    async existe(chave: string): Promise<boolean> {
        const exists = await this.redisClient.exists(chave);
        return exists === 1;
    }

    async bloquear(usuarioId: string, segundos: number): Promise<void> {
        const chave = `bloqueio:${usuarioId}`;
        await this.redisClient.setEx(chave, segundos, 'true');
        this.logger.warn(`Usuário ${usuarioId} bloqueado por ${segundos}s`);
    }

    async estaBloqueado(usuarioId: string): Promise<boolean> {
        const chave = `bloqueio:${usuarioId}`;
        return await this.existe(chave);
    }

    async tempoRestanteBloqueio(usuarioId: string): Promise<number> {
        const chave = `bloqueio:${usuarioId}`;
        const ttl = await this.redisClient.ttl(chave);
        return Math.max(0, ttl);
    }

    async desbloquear(usuarioId: string): Promise<void> {
        const chave = `bloqueio:${usuarioId}`;
        await this.remover(chave);
        this.logger.log(`Usuário ${usuarioId} desbloqueado`);
    }

    async limparTudo(): Promise<void> {
        await this.redisClient.flushDb();
        this.logger.log('Cache completamente limpo');
    }

    async obterEstatisticas(): Promise<{
        totalItens: number;
        totalBloqueios: number;
    }> {
        const totalItens = await this.redisClient.dbSize();
        const bloqueios = await this.redisClient.keys('bloqueio:*');
        const totalBloqueios = bloqueios.length;
        return {
            totalItens,
            totalBloqueios,
        };
    }

    async definirMultiplos(
        itens: Array<{ chave: string; valor: any; ttlSegundos: number }>,
    ): Promise<void> {
        const pipeline = this.redisClient.multi();
        for (const item of itens) {
            pipeline.setEx(
                item.chave,
                item.ttlSegundos,
                JSON.stringify(item.valor),
            );
        }
        await pipeline.exec();
    }

    async obterMultiplos(chaves: string[]): Promise<Map<string, any>> {
        const valores = await this.redisClient.mGet(chaves);
        const resultado = new Map<string, any>();
        for (let i = 0; i < chaves.length; i++) {
            const valor = valores[i];
            if (valor !== null && valor !== undefined) {
                resultado.set(chaves[i], JSON.parse(valor));
            }
        }
        return resultado;
    }
}
