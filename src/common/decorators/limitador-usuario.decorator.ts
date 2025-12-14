import { SetMetadata } from '@nestjs/common';

export const LIMITADOR_USUARIO_KEY = 'limitador_usuario';

export interface ConfigLimitadorUsuario {
    limite: number;
    janela: number;
    mensagem?: string;
    bloquearApos?: number;
    duracaoBloqueio?: number;
}

export const LimitadorUsuario = (
    limite: number,
    janela: number,
    opcoes?: Partial<Omit<ConfigLimitadorUsuario, 'limite' | 'janela'>>,
) =>
    SetMetadata(LIMITADOR_USUARIO_KEY, {
        limite,
        janela,
        mensagem: opcoes?.mensagem,
        bloquearApos: opcoes?.bloquearApos,
        duracaoBloqueio: opcoes?.duracaoBloqueio,
    } as ConfigLimitadorUsuario);

export const LimitarResetSenha = () =>
    LimitadorUsuario(3, 3600, {
        mensagem: 'Muitas solicitações de reset de senha. Aguarde 1 hora.',
        bloquearApos: 5,
        duracaoBloqueio: 120,
    });

export const LimitarEnvioSMS = () =>
    LimitadorUsuario(3, 60, {
        mensagem: 'Você atingiu o limite de envios de SMS. Aguarde 1 minuto.',
        bloquearApos: 5,
        duracaoBloqueio: 15,
    });

/**
 * Decorator para limitar criação de aluguéis (10 por hora)
 */
export const LimitarCriacaoAluguel = () =>
    LimitadorUsuario(10, 3600, {
        mensagem:
            'Você atingiu o limite de criação de aluguéis. Aguarde 1 hora.',
    });

export const LimitarUpload = () =>
    LimitadorUsuario(20, 3600, {
        mensagem: 'Você atingiu o limite de uploads. Aguarde 1 hora.',
        bloquearApos: 5,
        duracaoBloqueio: 60,
    });

/**
 * Decorator para limitar abertura de disputas (3 por dia)
 */
export const LimitarDisputa = () =>
    LimitadorUsuario(3, 86400, {
        mensagem:
            'Você atingiu o limite de disputas por dia. Aguarde 24 horas.',
        bloquearApos: 2,
        duracaoBloqueio: 120,
    });

/**
 * Decorator para ações muito restritivas (1 por hora)
 */
export const LimitarAcaoRestrita = (mensagem?: string) =>
    LimitadorUsuario(1, 3600, {
        mensagem:
            mensagem || 'Esta ação só pode ser executada uma vez por hora.',
    });
