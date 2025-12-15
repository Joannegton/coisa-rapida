export interface EmailVerificationToken {
    sub: string;
    email: string;
    type: 'email_verification';
    iat?: number;
    exp?: number;
}
export interface UsuarioEmailService {
    enviarLinkVerificacao(
        email: string,
        verificationUrl: string,
    ): Promise<void>;
    enviarEmailBoasVindas(email: string): Promise<void>;
    gerarTokenVerificacao(
        usuarioId: string,
        email: string,
        baseUrl: string,
    ): string;
    validarTokenVerificacao(token: string): EmailVerificationToken;
    gerarUrlVerificacao(usuarioId: string, email: string): string;
}
