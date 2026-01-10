import { Request } from 'express';

export class Utils {
    static obterIpCliente(req: Request): string {
        // Suporta proxies (Heroku, AWS, Cloudflare, etc)
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }

        // Suporta Nginx e outros proxies
        const realIp = req.headers['x-real-ip'];
        if (typeof realIp === 'string') {
            return realIp.trim();
        }

        // Fallback para conexões diretas
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }

    static normalizarIp(ip: string): string {
        return ip === '::1' ? '127.0.0.1' : ip;
    }

    /**
     * Formata distância em metros para formato legível.
     * - < 1000m: exibe em metros (ex: "345 m")
     * - >= 1000m: exibe em quilômetros com 1 casa decimal (ex: "2.5 km")
     *
     * @param metros - Distância em metros
     * @returns String formatada
     */
    static formatarDistancia(metros: number): string {
        if (metros < 1000) {
            return `${Math.round(metros)} m`;
        } else {
            const km = metros / 1000;
            return `${km.toFixed(1)} km`;
        }
    }
}

