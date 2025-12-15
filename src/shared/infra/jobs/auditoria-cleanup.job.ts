import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LessThan } from 'typeorm';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import { AuditoriaRepository } from '../repositories/auditoria.repository';
import { AuditoriaConfig } from 'src/shared/configs/auditoria.config';
import { AuditoriaModel } from '../models/auditoria.model';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

const gzip = promisify(zlib.gzip);

/**
 * Job de limpeza e arquivamento de logs de auditoria
 * Executa automaticamente baseado na configuração
 */
@Injectable()
export class AuditoriaCleanupJob {
    private readonly logger = new Logger(AuditoriaCleanupJob.name);

    constructor(private readonly auditoriaRepository: AuditoriaRepository) {}

    /**
     * Job executado mensalmente para limpar logs antigos
     * Cron: 1º dia do mês às 2h da manhã
     */
    @Cron(AuditoriaConfig.job.cronExpression, {
        disabled: !AuditoriaConfig.job.enabled,
    })
    async limparLogsAntigos(): Promise<void> {
        try {
            const estatisticas = {
                logsArquivados: 0,
                logsRemovidos: 0,
                logsComplianceMantidos: 0,
                erros: 0,
            };

            await this.processarLogsOperacionais(estatisticas);

            await this.processarLogsCriticos(estatisticas);

            await this.criarNovasParticoes();
        } catch (error) {
            this.logger.error(
                `❌ Erro no job de limpeza: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Processa e remove logs operacionais antigos (baixo/médio)
     */
    private async processarLogsOperacionais(estatisticas: any): Promise<void> {
        const dataLimite = this.calcularDataLimite(
            AuditoriaConfig.retencao.operacional,
        );

        this.logger.log(
            `Processando logs operacionais anteriores a ${dataLimite.toISOString()}`,
        );

        const logs = await this.auditoriaRepository.find({
            where: {
                timestamp: LessThan(dataLimite),
                nivel: 'baixo' as any,
            },
            take: AuditoriaConfig.job.batchSize,
        });

        if (logs.length === 0) {
            this.logger.log('Nenhum log operacional para processar');
            return;
        }

        // Arquivar antes de remover (se habilitado)
        if (AuditoriaConfig.arquivamento.enabled) {
            await this.arquivarLogs(logs, 'operacional');
            estatisticas.logsArquivados += logs.length;
        }

        // Remover logs
        const logsParaRemover = logs.filter(
            (log) => !this.isAcaoCompliance(log.acao),
        );

        if (logsParaRemover.length > 0) {
            await this.auditoriaRepository.remove(logsParaRemover);
            estatisticas.logsRemovidos += logsParaRemover.length;
        }

        estatisticas.logsComplianceMantidos +=
            logs.length - logsParaRemover.length;
    }

    /**
     * Processa e arquiva logs críticos antigos
     */
    private async processarLogsCriticos(estatisticas: any): Promise<void> {
        const dataLimite = this.calcularDataLimite(
            AuditoriaConfig.retencao.critico,
        );

        this.logger.log(
            `Processando logs críticos anteriores a ${dataLimite.toISOString()}`,
        );

        const logs = await this.auditoriaRepository.find({
            where: {
                timestamp: LessThan(dataLimite),
                nivel: 'critico' as any,
            },
            take: AuditoriaConfig.job.batchSize,
        });

        if (logs.length === 0) {
            this.logger.log('Nenhum log crítico para processar');
            return;
        }

        // Sempre arquivar logs críticos
        await this.arquivarLogs(logs, 'critico');
        estatisticas.logsArquivados += logs.length;

        // Não remover logs de compliance
        const logsParaRemover = logs.filter(
            (log) => !this.isAcaoCompliance(log.acao),
        );

        if (logsParaRemover.length > 0) {
            await this.auditoriaRepository.remove(logsParaRemover);
            estatisticas.logsRemovidos += logsParaRemover.length;
        }

        estatisticas.logsComplianceMantidos +=
            logs.length - logsParaRemover.length;
    }

    /**
     * Arquiva logs em arquivo local (ou S3 em produção)
     */
    private async arquivarLogs(
        logs: AuditoriaModel[],
        tipo: string,
    ): Promise<void> {
        try {
            const dataArquivo = new Date().toISOString().split('T')[0];
            const nomeArquivo = `auditoria_${tipo}_${dataArquivo}.jsonl`;
            const caminhoArquivo = path.join(
                AuditoriaConfig.arquivamento.localPath,
                nomeArquivo,
            );

            // Garantir que o diretório existe
            await fs.mkdir(path.dirname(caminhoArquivo), { recursive: true });

            // Converter para JSONL (JSON Lines)
            const jsonLines = logs.map((log) => JSON.stringify(log)).join('\n');

            // Comprimir se habilitado
            let conteudo: Buffer;
            if (AuditoriaConfig.arquivamento.compressao) {
                conteudo = await gzip(jsonLines);
                await fs.writeFile(`${caminhoArquivo}.gz`, conteudo);
            } else {
                await fs.writeFile(caminhoArquivo, jsonLines, 'utf-8');
            }

            this.logger.log(
                `📦 Arquivados ${logs.length} logs em ${nomeArquivo}${AuditoriaConfig.arquivamento.compressao ? '.gz' : ''}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao arquivar logs: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Cria novas partições para os próximos meses
     */
    private async criarNovasParticoes(): Promise<void> {
        try {
            // Chamar função PostgreSQL para criar partição do próximo mês
            await this.auditoriaRepository.query(
                'SELECT criar_particao_auditoria();',
            );
            this.logger.log('✅ Verificada criação de novas partições');
        } catch (error) {
            this.logger.warn(`Aviso ao criar partições: ${error.message}`);
        }
    }

    /**
     * Verifica se uma ação é considerada de compliance
     */
    private isAcaoCompliance(acao: string): boolean {
        return (AuditoriaConfig.acoesCompliance as readonly string[]).includes(
            acao,
        );
    }

    /**
     * Calcula data limite baseada em meses de retenção
     */
    private calcularDataLimite(meses: number): Date {
        const data = new Date();
        data.setMonth(data.getMonth() - meses);
        return data;
    }

    /**
     * Método manual para forçar limpeza (útil para testes ou manutenção)
     */
    async executarLimpezaManual(): Promise<void> {
        this.logger.log('🔧 Executando limpeza manual...');
        await this.limparLogsAntigos();
    }

    /**
     * Obtém estatísticas de armazenamento
     */
    async obterEstatisticasArmazenamento(): Promise<{
        totalLogs: number;
        logsOperacionais: number;
        logsCriticos: number;
        logsCompliance: number;
        tamanhoEstimadoMB: number;
    }> {
        const [totalResult] = await this.auditoriaRepository.query(
            'SELECT COUNT(*) as total FROM auditoria',
        );

        const [operacionaisResult] = await this.auditoriaRepository.query(
            "SELECT COUNT(*) as total FROM auditoria WHERE nivel IN ('baixo', 'medio')",
        );

        const [criticosResult] = await this.auditoriaRepository.query(
            "SELECT COUNT(*) as total FROM auditoria WHERE nivel IN ('alto', 'critico')",
        );

        const [complianceResult] = await this.auditoriaRepository.query(
            `SELECT COUNT(*) as total FROM auditoria WHERE acao = ANY($1)`,
            [AuditoriaConfig.acoesCompliance as readonly string[]],
        );

        const [tamanhoResult] = await this.auditoriaRepository.query(
            "SELECT pg_total_relation_size('auditoria') as size",
        );

        return {
            totalLogs: Number.parseInt(totalResult.total),
            logsOperacionais: Number.parseInt(operacionaisResult.total),
            logsCriticos: Number.parseInt(criticosResult.total),
            logsCompliance: Number.parseInt(complianceResult.total),
            tamanhoEstimadoMB: Math.round(tamanhoResult.size / 1024 / 1024),
        };
    }
}
