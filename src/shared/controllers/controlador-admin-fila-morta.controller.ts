import { Controller, Get, Post, Delete, Param, Logger } from '@nestjs/common';
import { DeadLetterQueueService } from 'src/shared/infra/services/dead-letter-queue.service';
import { Roles } from 'src/common/decorators/roles.decorator';

/**
 * 🛠️ CONTROLLER ADMINISTRATIVO - Fila Morta
 *
 * Endpoints para gerenciamento manual de mensagens na Fila Morta.
 * Usado por administradores para investigar e resolver falhas críticas.
 *
 * Funcionalidades:
 * - Listar mensagens na Fila Morta
 * - Visualizar detalhes de uma mensagem
 * - Remover mensagem (após resolução)
 * - Reprocessar mensagem (futuro)
 * - Estatísticas da Fila Morta
 */
@Controller('admin/fila-morta')
// @Roles('admin')
export class ControladorAdminFilaMortaController {
    private readonly logger = new Logger(
        ControladorAdminFilaMortaController.name,
    );

    constructor(
        private readonly servicoFilaMortaService: DeadLetterQueueService,
    ) {}

    /**
     * 📊 Lista todas as mensagens na Fila Morta
     */
    @Get('mensagens')
    async obterMensagens() {
        this.logger.log('📋 Listando mensagens da Fila Morta');

        const mensagens = await this.servicoFilaMortaService.obterMensagens();

        return {
            sucesso: true,
            dados: mensagens,
            quantidade: mensagens.length,
        };
    }

    /**
     * 📈 Estatísticas da Fila Morta
     */
    @Get('estatisticas')
    async obterEstatisticas() {
        this.logger.log('📊 Obtendo estatísticas da Fila Morta');

        const stats = await this.servicoFilaMortaService.obterEstatisticas();

        return {
            sucesso: true,
            dados: stats,
        };
    }

    /**
     * 🔍 Detalhes de uma mensagem específica
     */
    @Get('mensagens/:idMensagem')
    async obterMensagem(@Param('idMensagem') idMensagem: string) {
        this.logger.log(`🔍 Buscando mensagem ${idMensagem} na Fila Morta`);

        const mensagens = await this.servicoFilaMortaService.obterMensagens();
        const mensagem = mensagens.find((m) => m.id === idMensagem);

        if (!mensagem) {
            return {
                sucesso: false,
                erro: 'Mensagem não encontrada na Fila Morta',
            };
        }

        return {
            sucesso: true,
            dados: mensagem,
        };
    }

    /**
     * 🗑️ Remove uma mensagem da Fila Morta (após resolução manual)
     */
    @Delete('mensagens/:idMensagem')
    async removerMensagem(@Param('idMensagem') idMensagem: string) {
        this.logger.warn(`🗑️ Removendo mensagem ${idMensagem} da Fila Morta`);

        try {
            const removida =
                await this.servicoFilaMortaService.removerMensagem(idMensagem);

            if (removida) {
                return {
                    sucesso: true,
                    mensagem: `Mensagem ${idMensagem} removida da Fila Morta`,
                };
            } else {
                return {
                    sucesso: false,
                    erro: 'Mensagem não encontrada',
                };
            }
        } catch (erro) {
            this.logger.error(
                `Erro ao remover mensagem ${idMensagem}: ${erro.message}`,
            );

            return {
                sucesso: false,
                erro: erro.message,
            };
        }
    }

    /**
     * 🔄 Reprocessa uma mensagem (futuro - quando implementado)
     */
    @Post('mensagens/:idMensagem/reprocessar')
    async reprocessarMensagem(@Param('idMensagem') idMensagem: string) {
        this.logger.log(`🔄 Tentando reprocessar mensagem ${idMensagem}`);

        try {
            const resultado =
                await this.servicoFilaMortaService.reprocessarMensagem(
                    idMensagem,
                );

            return {
                sucesso: resultado,
                dados: resultado,
                mensagem: `Mensagem ${idMensagem} reprocessada`,
            };
        } catch (erro) {
            this.logger.error(
                `Erro ao reprocessar mensagem ${idMensagem}: ${erro.message}`,
            );

            return {
                sucesso: false,
                erro: erro.message,
            };
        }
    }
}
