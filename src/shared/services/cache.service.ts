import { Injectable, Logger } from '@nestjs/common';

// mudar para redis
@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    private readonly cache: Map<string, { valor: any; expiraEm: number }> =
        new Map();

    constructor() {
        setInterval(() => this.limparExpirados(), 60 * 1000);
    }

    async definir(
        chave: string,
        valor: any,
        ttlSegundos: number,
    ): Promise<void> {
        const expiraEm = Date.now() + ttlSegundos * 1000;
        this.cache.set(chave, { valor, expiraEm });
    }

    async obter<T = any>(chave: string): Promise<T | null> {
        const item = this.cache.get(chave);

        if (!item) {
            return null;
        }

        if (Date.now() > item.expiraEm) {
            this.cache.delete(chave);
            return null;
        }

        return item.valor as T;
    }

    async incrementar(chave: string, ttlSegundos: number): Promise<number> {
        const valorAtual = (await this.obter<number>(chave)) || 0;
        const novoValor = valorAtual + 1;

        await this.definir(chave, novoValor, ttlSegundos);

        return novoValor;
    }

    async decrementar(chave: string): Promise<number> {
        const valorAtual = (await this.obter<number>(chave)) || 0;
        const novoValor = Math.max(0, valorAtual - 1);

        const item = this.cache.get(chave);
        if (item) {
            const ttlRestante = Math.ceil((item.expiraEm - Date.now()) / 1000);
            await this.definir(chave, novoValor, ttlRestante);
        }

        return novoValor;
    }

    async remover(chave: string): Promise<void> {
        this.cache.delete(chave);
    }

    async removerPorPrefixo(prefixo: string): Promise<number> {
        let removidos = 0;

        for (const chave of this.cache.keys()) {
            if (chave.startsWith(prefixo)) {
                this.cache.delete(chave);
                removidos++;
            }
        }

        return removidos;
    }

    async existe(chave: string): Promise<boolean> {
        const valor = await this.obter(chave);
        return valor !== null;
    }

    async bloquear(usuarioId: string, segundos: number): Promise<void> {
        const chave = `bloqueio:${usuarioId}`;
        await this.definir(chave, true, segundos);
        this.logger.warn(`Usuário ${usuarioId} bloqueado por ${segundos}s`);
    }

    async estaBloqueado(usuarioId: string): Promise<boolean> {
        const chave = `bloqueio:${usuarioId}`;
        return await this.existe(chave);
    }

    async tempoRestanteBloqueio(usuarioId: string): Promise<number> {
        const chave = `bloqueio:${usuarioId}`;
        const item = this.cache.get(chave);

        if (!item) {
            return 0;
        }

        const restante = Math.ceil((item.expiraEm - Date.now()) / 1000);
        return Math.max(0, restante);
    }

    async desbloquear(usuarioId: string): Promise<void> {
        const chave = `bloqueio:${usuarioId}`;
        await this.remover(chave);
        this.logger.log(`Usuário ${usuarioId} desbloqueado`);
    }

    private limparExpirados(): void {
        const agora = Date.now();
        let removidos = 0;

        for (const [chave, item] of this.cache.entries()) {
            if (agora > item.expiraEm) {
                this.cache.delete(chave);
                removidos++;
            }
        }

        if (removidos > 0) {
            this.logger.debug(
                `${removidos} itens expirados removidos do cache`,
            );
        }
    }

    async limparTudo(): Promise<void> {
        this.cache.clear();
        this.logger.log('Cache completamente limpo');
    }

    obterEstatisticas(): {
        totalItens: number;
        totalBloqueios: number;
        tamanhoMemoria: number;
    } {
        let totalBloqueios = 0;

        for (const chave of this.cache.keys()) {
            if (chave.startsWith('bloqueio:')) {
                totalBloqueios++;
            }
        }

        return {
            totalItens: this.cache.size,
            totalBloqueios,
            tamanhoMemoria: 0, // Implementar cálculo se necessário
        };
    }

    async definirMultiplos(
        itens: Array<{ chave: string; valor: any; ttlSegundos: number }>,
    ): Promise<void> {
        for (const item of itens) {
            await this.definir(item.chave, item.valor, item.ttlSegundos);
        }
    }

    async obterMultiplos(chaves: string[]): Promise<Map<string, any>> {
        const resultado = new Map<string, any>();

        for (const chave of chaves) {
            const valor = await this.obter(chave);
            if (valor !== null) {
                resultado.set(chave, valor);
            }
        }

        return resultado;
    }

    listarChaves(): string[] {
        return Array.from(this.cache.keys());
    }
}
