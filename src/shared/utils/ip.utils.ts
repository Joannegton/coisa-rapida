import { Request } from 'express';

export class IpUtils {
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
}
