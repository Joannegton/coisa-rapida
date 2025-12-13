import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaModel } from '../models/auditoria.model';

interface LogAuditoria {
    id?: number;
    timestamp: Date;
    usuarioId: string;
    usuarioEmail?: string;
    modulo?: string;
    acao: string;
    recurso: string;
    recursoId?: string;
    descricao?: string;
    nivel: 'baixo' | 'medio' | 'alto' | 'critico';
    metodo?: string;
    rota?: string;
    ip?: string;
    userAgent?: string;
    statusCode?: number;
    duracaoMs?: number;
    erro?: string;
    estadoAntes?: any;
    estadoDepois?: any;
    mudancas?: Array<{
        campo: string;
        valorAntes: any;
        valorDepois: any;
    }>;
}

@Injectable()
export class AuditoriaRepository {
    private readonly logger = new Logger(AuditoriaRepository.name);

    constructor(
        @InjectRepository(AuditoriaModel)
        private readonly auditoriaRepo: Repository<AuditoriaModel>,
    ) {}

    async criar(log: LogAuditoria): Promise<void> {
        try {
            const model = this.auditoriaRepo.create({
                usuarioId: log.usuarioId,
                usuarioEmail: log.usuarioEmail,
                modulo: log.modulo,
                acao: log.acao,
                recurso: log.recurso,
                recursoId: log.recursoId,
                descricao: log.descricao,
                nivel: log.nivel,
                metodo: log.metodo,
                rota: log.rota,
                ip: log.ip,
                userAgent: log.userAgent,
                statusCode: log.statusCode,
                duracaoMs: log.duracaoMs,
                erro: log.erro,
                estadoAntes: log.estadoAntes,
                estadoDepois: log.estadoDepois,
                mudancas: log.mudancas,
            });
            await this.auditoriaRepo.save(model);
        } catch (error) {
            this.logger.error(
                `Erro ao criar log de auditoria: ${error.message}`,
                error.stack,
            );
        }
    }

    async find(options: any): Promise<AuditoriaModel[]> {
        try {
            return await this.auditoriaRepo.find(options);
        } catch (error) {
            this.logger.error(
                `Erro ao buscar logs de auditoria: ${error.message}`,
                error.stack,
            );
            return [];
        }
    }

    async remove(logs: AuditoriaModel[]): Promise<void> {
        try {
            await this.auditoriaRepo.remove(logs);
        } catch (error) {
            this.logger.error(
                `Erro ao remover logs de auditoria: ${error.message}`,
                error.stack,
            );
        }
    }

    async query(sql: string, parameters?: any[]): Promise<any> {
        try {
            return await this.auditoriaRepo.query(sql, parameters);
        } catch (error) {
            this.logger.error(
                `Erro ao executar query de auditoria: ${error.message}`,
                error.stack,
            );
            return null;
        }
    }

    async buscarPorUsuario(usuarioId: string): Promise<AuditoriaModel[]> {
        try {
            return await this.auditoriaRepo.find({ where: { usuarioId } });
        } catch (error) {
            this.logger.error(
                `Erro ao buscar logs de auditoria por usuário: ${error.message}`,
                error.stack,
            );
            return [];
        }
    }

    async buscarPorModulo(modulo: string): Promise<AuditoriaModel[]> {
        try {
            return await this.auditoriaRepo.find({ where: { modulo } });
        } catch (error) {
            this.logger.error(
                `Erro ao buscar logs de auditoria por módulo: ${error.message}`,
                error.stack,
            );
            return [];
        }
    }
}
