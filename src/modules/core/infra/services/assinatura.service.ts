import { AssinaturaService } from '../../domain/services/assinatura.service';
import { JwtService } from '@nestjs/jwt';

export type gerarAssinaturaDigitalProps = {
    aluguelId: string;
    usuarioId: string;
    usuarioTipo: 'locador' | 'locatario';
    enderecoIp: string;
    userAgent: string;
    dataHora: Date;
    latitude?: number;
    longitude?: number;
    versaoContrato: number;
};
//TODO ao inves de usar jwt, no futuro mudar para plataformas de assinatura digital dedicadas como (ClickSign, D4Sign, SuperSign, DocuSign) ou gov.br
export class AssinaturaServiceImpl implements AssinaturaService {
    constructor(private readonly nestJwtService: JwtService) {}

    gerarAssinaturaDigital(payload: gerarAssinaturaDigitalProps): string {
        const dadosAssinatura = {
            aluguelId: payload.aluguelId,
            usuarioId: payload.usuarioId,
            usuarioTipo: payload.usuarioTipo,
            enderecoIp: payload.enderecoIp,
            userAgent: payload.userAgent,
            dataHora: payload.dataHora.toISOString(),
            latitude: payload.latitude,
            longitude: payload.longitude,
            versaoContrato: payload.versaoContrato,
        };

        return this.nestJwtService.sign(dadosAssinatura, {
            expiresIn: '365d',
            subject: payload.aluguelId,
        });
    }

    validarAssinaturaDigital(assinatura: string): boolean {
        try {
            this.nestJwtService.verify(assinatura, {
                issuer: 'coisa-rapida-contratos',
            });
            return true;
        } catch {
            return false;
        }
    }

    decodificarAssinatura(
        assinatura: string,
    ): gerarAssinaturaDigitalProps | null {
        try {
            const decoded = this.nestJwtService.decode(assinatura);
            return decoded as gerarAssinaturaDigitalProps;
        } catch (error) {
            console.warn('Falha ao decodificar assinatura JWT:', error);
            return null;
        }
    }
}
