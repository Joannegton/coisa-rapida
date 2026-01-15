import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { VirusTotalService } from 'src/shared/infra/services/VirusTotal.service';
import {
    CloudinaryService,
    TipoUploadCloudinary,
} from 'src/shared/infra/services/Cloudinary.service';
import type { VerificacaoVirusJob } from '../services/verificacao-virus.fila.service';
import { AuditoriaService } from '../services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

@Processor('verificacao-virus')
export class VerificacaoVirusProcessor {
    private readonly logger = new Logger(VerificacaoVirusProcessor.name);

    constructor(
        private readonly virusTotalService: VirusTotalService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    @Process('verificar-arquivo')
    async verificarArquivo(job: Job<VerificacaoVirusJob>): Promise<void> {
        const { publicId, idAnaliseVirusTotal, usuarioId, tipoUpload } =
            job.data;

        const moduloModeracao = this.getModuloModeracao(tipoUpload);

        try {
            const resultado =
                await this.virusTotalService.consultarAnalise(
                    idAnaliseVirusTotal,
                );

            if (resultado.status === 'completed') {
                await this.processarAnaliseCompletada(
                    resultado,
                    job,
                    publicId,
                    usuarioId,
                    tipoUpload,
                    moduloModeracao,
                    idAnaliseVirusTotal,
                );
                return;
            }

            this.logger.log(
                `⏳ Análise ainda em progresso (Status: ${resultado.status}) - Tentando novamente (jobId=${job.id} attempts=${job.attemptsMade})`,
            );
            throw new Error(`Análise ainda em progresso: ${resultado.status}`);
        } catch (error) {
            await this.tratarErroConsulta(
                error,
                job,
                idAnaliseVirusTotal,
                publicId,
                usuarioId,
            );
        }
    }

    private getModuloModeracao(tipoUpload: TipoUploadCloudinary): string {
        return tipoUpload === TipoUploadCloudinary.ITEM_FOTO
            ? 'item'
            : 'usuario';
    }

    private async processarAnaliseCompletada(
        resultado: any,
        job: Job<VerificacaoVirusJob>,
        publicId: string,
        usuarioId: string,
        tipoUpload: TipoUploadCloudinary,
        moduloModeracao: string,
        idAnaliseVirusTotal: string,
    ): Promise<void> {
        if (resultado.infectado) {
            await this.processarArquivoInfectado(
                publicId,
                usuarioId,
                tipoUpload,
                moduloModeracao,
                idAnaliseVirusTotal,
                job.id,
            );
            return;
        }

        this.logger.log(
            `✅ Arquivo verificado e aprovado: ${publicId} (Usuário: ${usuarioId}) (jobId=${job.id})`,
        );
    }

    private async processarArquivoInfectado(
        publicId: string,
        usuarioId: string,
        tipoUpload: TipoUploadCloudinary,
        moduloModeracao: string,
        idAnaliseVirusTotal: string,
        jobId: string | number,
    ): Promise<void> {
        try {
            const deleteResult =
                await this.cloudinaryService.deletarArquivoCloudinary(publicId);

            await this.validarDelecao(
                deleteResult,
                publicId,
                usuarioId,
                moduloModeracao,
                jobId,
            );

            this.logDelecaoArquivoInfectado(publicId, usuarioId, tipoUpload);

            await this.auditoriaService.criar({
                usuarioId: usuarioId,
                acao: AuditoriaAcao.ARQUIVO_INFECTADO_DETECTADO,
                recurso:
                    'Deleção de arquivo infectado do Cloudinary e ações no banco',
                nivel: 'alto',
                descricao: `Arquivo infectado com vírus foi deletado do Cloudinary. Public ID: ${publicId}, Tipo Upload: ${tipoUpload}, ID Análise VirusTotal: ${idAnaliseVirusTotal}`,
                timestamp: new Date(),
                modulo: moduloModeracao,
            });
        } catch (deleteError) {
            await this.tratarErroDelecao(
                deleteError,
                publicId,
                usuarioId,
                tipoUpload,
                moduloModeracao,
                idAnaliseVirusTotal,
            );
        }
    }

    private async validarDelecao(
        deleteResult: any,
        publicId: string,
        usuarioId: string,
        moduloModeracao: string,
        jobId: string | number,
    ): Promise<void> {
        const deletedOk =
            (typeof deleteResult === 'string' && deleteResult === 'ok') ||
            deleteResult?.result === 'ok';

        if (!deletedOk) {
            this.logger.error(
                `❌ Falha ao deletar arquivo do Cloudinary (resposta inesperada): ${publicId} (jobId=${jobId})`,
            );
            await this.auditoriaService
                .criar({
                    usuarioId: usuarioId,
                    acao: 'falha_delecao_arquivo_infectado',
                    recurso: 'Deleção de arquivo infectado do Cloudinary',
                    nivel: 'critico',
                    descricao: `Resposta inesperada ao deletar arquivo infectado. publicId=${publicId} deleteResult=${JSON.stringify(deleteResult)}`,
                    timestamp: new Date(),
                    modulo: moduloModeracao,
                    erro: `deleteResult=${JSON.stringify(deleteResult)}`,
                })
                .catch(() => {
                    this.logger.error(
                        `❌ Falha ao criar log de auditoria para deleção falhada ${publicId}`,
                    );
                });
        }
    }

    private logDelecaoArquivoInfectado(
        publicId: string,
        usuarioId: string,
        tipoUpload: TipoUploadCloudinary,
    ): void {
        const mensagens = {
            [TipoUploadCloudinary.ITEM_FOTO]: `⚠️ Arquivo infectado deletado do Cloudinary: ${publicId} (Usuário: ${usuarioId})`,
            [TipoUploadCloudinary.COMPROVANTE_RESIDENCIA]: `⚠️ Comprovante de residência infectado deletado do Cloudinary: ${publicId} (Usuário: ${usuarioId})`,
            [TipoUploadCloudinary.USUARIO_FOTO]: `⚠️ Foto de usuário infectada deletada do Cloudinary: ${publicId} (Usuário: ${usuarioId})`,
        };

        this.logger.log(
            mensagens[tipoUpload] ||
                `⚠️ Arquivo infectado deletado: ${publicId}`,
        );

        // TODO: Adicionar ações pós-deleção:
        // - Notificar usuário que arquivo foi bloqueado
        // - Marcar item/usuario/comprovante como suspeito no DB
        // - Atualizar estado do recurso relacionado
    }

    private async tratarErroDelecao(
        deleteError: any,
        publicId: string,
        usuarioId: string,
        tipoUpload: TipoUploadCloudinary,
        moduloModeracao: string,
        idAnaliseVirusTotal: string,
    ): Promise<void> {
        this.logger.error(
            `❌ FALHA AO DELETAR arquivo infectado ${publicId}: ${deleteError.message}`,
        );
        await this.auditoriaService
            .criar({
                usuarioId: usuarioId,
                acao: AuditoriaAcao.ARQUIVO_INFECTADO_DETECTADO,
                recurso:
                    'Falha na deleção de arquivo infectado do Cloudinary ou ações no banco',
                nivel: 'critico',
                descricao: `Arquivo infectado com vírus não foi deletado do Cloudinary ou ações no banco. Public ID: ${publicId}, Tipo Upload: ${tipoUpload}, ID Análise VirusTotal: ${idAnaliseVirusTotal}`,
                timestamp: new Date(),
                modulo: moduloModeracao,
                erro: deleteError.message,
            })
            .catch(() => {
                this.logger.error(
                    `❌ FALHA AO CRIAR log de auditoria para arquivo infectado ${publicId}`,
                );
            });
    }

    private isErroTemporario(error: any): boolean {
        const statusCode = error?.response?.status || null;
        const errCode = error?.code || null;

        return (
            statusCode === 429 ||
            errCode === 'ETIMEDOUT' ||
            errCode === 'ECONNABORTED' ||
            /timeout/i.test(error.message || '')
        );
    }

    private async tratarErroConsulta(
        error: any,
        job: Job<VerificacaoVirusJob>,
        idAnaliseVirusTotal: string,
        publicId: string,
        usuarioId: string,
    ): Promise<void> {
        if (this.isErroTemporario(error)) {
            const statusCode = error?.response?.status || null;
            const errCode = error?.code || null;
            this.logger.warn(
                `⚠️ [jobId=${job.id}] Erro temporário ao consultar VirusTotal (status=${statusCode} code=${errCode}) — permitindo retry: ${error.message}`,
            );
            throw error; // Bull fará backoff e retry
        }

        this.logger.error(
            `❌ Erro ao consultar análise ${idAnaliseVirusTotal} (jobId=${job.id} attempts=${job.attemptsMade}): ${error.message}`,
            error.stack,
        );

        await this.auditoriaService
            .criar({
                usuarioId: usuarioId,
                acao: 'erro_consulta_virus_total',
                recurso: 'Consulta de análise no VirusTotal',
                nivel: 'medio',
                descricao: `Erro ao consultar análise no VirusTotal. publicId=${publicId} idAnaliseVirusTotal=${idAnaliseVirusTotal} error=${error.message}`,
                timestamp: new Date(),
                modulo: this.getModuloModeracao(job.data.tipoUpload),
            })
            .catch(() => {
                this.logger.error(
                    `❌ FALHA AO CRIAR log de auditoria para erro de consulta ${idAnaliseVirusTotal}`,
                );
            });

        throw error; // Bull vai retentar automaticamente por padrão
    }
}
