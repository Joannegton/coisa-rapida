import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuditoriaCleanupJob } from '../infra/jobs/auditoria-cleanup.job';

/**
 * Controller para gerenciamento e manutenção de auditoria
 * Apenas para administradores
 */
@ApiTags('Auditoria - Admin')
@ApiBearerAuth('access-token')
@Controller('admin/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditoriaAdminController {
    constructor(private readonly auditoriaCleanupJob: AuditoriaCleanupJob) {}

    /**
     * Obtém estatísticas de armazenamento de logs
     */
    @Get('estatisticas')
    @ApiOperation({
        summary: 'Estatísticas de armazenamento',
        description:
            'Retorna informações sobre quantidade e tamanho dos logs de auditoria',
    })
    async obterEstatisticas() {
        return await this.auditoriaCleanupJob.obterEstatisticasArmazenamento();
    }

    /**
     * Executa limpeza manual de logs antigos
     */
    @Post('limpar')
    @ApiOperation({
        summary: 'Executar limpeza manual',
        description: 'Força a execução do job de limpeza de logs antigos',
    })
    async executarLimpeza() {
        await this.auditoriaCleanupJob.executarLimpezaManual();
        return {
            message: 'Job de limpeza executado com sucesso',
            timestamp: new Date().toISOString(),
        };
    }
}
