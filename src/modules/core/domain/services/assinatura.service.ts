export type gerarAssinaturaDigitalProps = {
    aluguelId: string;
    usuarioId: string;
    usuarioTipo: 'locador' | 'locatario';
    enderecoIp: string;
    userAgent: string;
    dataHora: Date;
    latitude?: number;
    longitude?: number;
};

export interface AssinaturaService {
    gerarAssinaturaDigital(payload: gerarAssinaturaDigitalProps): string;
    validarAssinaturaDigital(assinatura: string): boolean;
    decodificarAssinatura(assinatura: string): gerarAssinaturaDigitalProps | null;
}
