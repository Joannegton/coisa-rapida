import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

export interface VerificarModeracaoJob {
    itemId: string;
    nome: string;
    descricao: string;
    usuarioId: string;
    prioridade: 'baixo' | 'medio' | 'alto';
    tentativa?: number;
}

type AgendarVerificacaoAvancadaProps = {
    itemId: string;
    nome: string;
    descricao: string;
    usuarioId: string;
    prioridade?: 'baixo' | 'medio' | 'alto';
};

@Injectable()
export class ModeracaoFilaService {
    private readonly logger = new Logger(ModeracaoFilaService.name);

    constructor(
        @InjectQueue('verificacao-avancada')
        private readonly moderationQueue: Queue<VerificarModeracaoJob>,
    ) {}

    async agendarVerificacaoAvancada(
        props: AgendarVerificacaoAvancadaProps,
    ): Promise<void> {
        try {
            await this.moderationQueue.add(
                'moderacao',
                {
                    itemId: props.itemId,
                    nome: props.nome,
                    descricao: props.descricao,
                    usuarioId: props.usuarioId,
                    prioridade: props.prioridade || 'baixo',
                    tentativa: 0,
                },
                {
                    priority:
                        props.prioridade === 'alto'
                            ? 1
                            : props.prioridade === 'medio'
                              ? 5
                              : 7,
                },
            );

            this.logger.log(
                `✅ Verificação avançada agendada para item: ${props.itemId} (${props.prioridade || 'baixo'})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao agendar verificação para item ${props.itemId}:`,
                error,
            );
            throw error;
        }
    }
}
