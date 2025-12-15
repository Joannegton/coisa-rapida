import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LIMITADOR_USUARIO_KEY } from '../decorators/limitador-usuario.decorator';
import { CacheService } from '../../shared/infra/services/cache.service';
import { IpUtils } from '../../shared/utils/ip.utils';

interface ConfigLimitadorUsuario {
    limite: number;
    janela: number;
    mensagem?: string;
    bloquearApos?: number;
    duracaoBloqueio?: number;
}

@Injectable()
export class LimitadorUsuarioGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly cacheService: CacheService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const config = this.reflector.getAllAndOverride<ConfigLimitadorUsuario>(
            LIMITADOR_USUARIO_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!config) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const usuario = request.user;

        const identificador = usuario?.sub || this.obterIp(request);
        const acao = this.obterIdentificadorAcao(context);

        if (await this.cacheService.estaBloqueado(identificador)) {
            const tempoRestante =
                await this.cacheService.tempoRestanteBloqueio(identificador);
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: `Você está temporariamente bloqueado. Tente novamente em ${Math.ceil(tempoRestante / 60)} minutos.`,
                    tempoRestante: Math.ceil(tempoRestante / 60),
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const chaveContador = `rate-limit:${identificador}:${acao}`;
        const chaveViolacoes = `rate-limit:${identificador}:${acao}:violacoes`;

        const tentativas = await this.cacheService.incrementar(
            chaveContador,
            config.janela,
        );

        if (tentativas > config.limite) {
            const violacoes = await this.cacheService.incrementar(
                chaveViolacoes,
                3600, // 1 hora
            );

            if (
                config.bloquearApos &&
                config.duracaoBloqueio &&
                violacoes >= config.bloquearApos
            ) {
                await this.cacheService.bloquear(
                    identificador,
                    config.duracaoBloqueio * 60,
                );

                throw new HttpException(
                    {
                        statusCode: HttpStatus.TOO_MANY_REQUESTS,
                        message: `Muitas tentativas. Você foi bloqueado por ${config.duracaoBloqueio} minutos.`,
                        tempoRestante: config.duracaoBloqueio,
                    },
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            const mensagemPadrao = `Limite de ${config.limite} requisições por ${this.formatarTempo(config.janela)} excedido. Tente novamente mais tarde.`;

            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: config.mensagem || mensagemPadrao,
                    limite: config.limite,
                    janela: config.janela,
                    tentativas,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }

    /**
     * Obtém um identificador único para a ação sendo executada.
     * Usa o nome da classe + método do controller.
     */
    private obterIdentificadorAcao(context: ExecutionContext): string {
        const classe = context.getClass().name;
        const metodo = context.getHandler().name;
        return `${classe}.${metodo}`;
    }

    /**
     * Formata o tempo em segundos para exibição amigável
     */
    private formatarTempo(segundos: number): string {
        if (segundos < 60) {
            return `${segundos} segundos`;
        } else if (segundos < 3600) {
            const minutos = Math.floor(segundos / 60);
            return `${minutos} minuto${minutos > 1 ? 's' : ''}`;
        } else if (segundos < 86400) {
            const horas = Math.floor(segundos / 3600);
            return `${horas} hora${horas > 1 ? 's' : ''}`;
        } else {
            const dias = Math.floor(segundos / 86400);
            return `${dias} dia${dias > 1 ? 's' : ''}`;
        }
    }

    private obterIp(request: any): string {
        const ip = IpUtils.obterIpCliente(request);
        return IpUtils.normalizarIp(ip);
    }
}
