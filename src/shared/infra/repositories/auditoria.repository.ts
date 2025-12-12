import { Injectable } from '@nestjs/common';
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
    constructor(
        @InjectRepository(AuditoriaModel)
        private readonly auditoriaRepo: Repository<AuditoriaModel>,
    ) {}

    async criar(log: LogAuditoria): Promise<void> {
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
    }

    async buscarPorUsuario(usuarioId: string): Promise<AuditoriaModel[]> {
        return this.auditoriaRepo.find({ where: { usuarioId } });
    }

    async buscarPorModulo(modulo: string): Promise<AuditoriaModel[]> {
        return this.auditoriaRepo.find({ where: { modulo } });
    }
}
