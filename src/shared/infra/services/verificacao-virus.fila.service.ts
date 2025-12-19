import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { TipoUploadCloudinary } from './Cloudinary.service';

export interface VerificacaoVirusJob {
    publicId: string;
    idAnaliseVirusTotal: string;
    usuarioId: string;
    tipoUpload: TipoUploadCloudinary;
    tentativa?: number;
}

@Injectable()
export class VerificacaoVirusFilaService {
    private readonly logger = new Logger(VerificacaoVirusFilaService.name);

    constructor(
        @InjectQueue('verificacao-virus')
        private readonly virusQueue: Queue<VerificacaoVirusJob>,
    ) {}

    async agendarVerificacao(props: VerificacaoVirusJob): Promise<void> {
        try {
            await this.virusQueue.add(
                'verificar-arquivo',
                {
                    publicId: props.publicId,
                    idAnaliseVirusTotal: props.idAnaliseVirusTotal,
                    usuarioId: props.usuarioId,
                    tipoUpload: props.tipoUpload,
                    tentativa: 0,
                },
                {
                    priority: 2,
                    attempts: 10,
                    backoff: {
                        type: 'exponential',
                        delay: 3000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            );

            this.logger.log(
                `✅ Verificação de vírus agendada para: ${props.publicId} (ID Análise: ${props.idAnaliseVirusTotal})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao agendar verificação de vírus: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }
}
