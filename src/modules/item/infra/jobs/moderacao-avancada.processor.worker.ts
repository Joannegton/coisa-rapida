import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { VerificarModeracaoJob } from '../services/moderacao.fila.service';
import { ValidadorConteudo } from 'src/shared/utils/validador-conteudo.utils';

/**
 * Worker que consome jobs da fila de moderação avançada
 * Executa verificações mais pesadas de forma assíncrona
 *
 * Responsabilidades:
 * - Verificações regex adicionais
 * - Chamadas a APIs externas (Hive, SightEngine, etc)
 * - Modelos de ML locais
 * - OCR em imagens
 * - Atualização do status do item
 */
@Processor('moderacao')
@Injectable()
export class AdvancedModerationWorker {
    private readonly logger = new Logger(AdvancedModerationWorker.name);

    @Process('verificacao-avancada')
    async handleAdvancedCheck(job: Job<VerificarModeracaoJob>) {
        const {
            itemId,
            nome,
            descricao,
            usuarioId,
            prioridade: severity,
            tentativa,
        } = job.data;

        this.logger.log(
            `🔍 [Tentativa ${(tentativa || 0) + 1}/3] Verificação avançada para item: ${itemId}`,
        );

        try {
            const revalidacao = ValidadorConteudo.validar(
                `${nome} ${descricao}`,
            );

            if (revalidacao.problemasDetectados.length > 0) {
                this.logger.warn(
                    `⚠️ Item ${itemId} contém problemas detectados novamente: ${revalidacao.problemasDetectados.join(', ')}`,
                );
                // Manter como PENDENTE_ANALISE
                return;
            }

            // 2️⃣ TODO: Integração com APIs externas
            // const hiveResult = await this.verificarComHive(nome, descricao);
            // if (hiveResult.isBloqueado) {
            //     await this.bloquearItem(itemId, hiveResult.motivo);
            //     return;
            // }

            // 3️⃣ TODO: Modelos de ML (se tiver)
            // const mlResult = await this.verificarComML(nome, descricao);

            // 4️⃣ Se passou em tudo, aprovar
            await this.aprovarItem(itemId);

            this.logger.log(
                `✅ Item ${itemId} aprovado após verificação avançada`,
            );
        } catch (error) {
            this.logger.error(
                `❌ [Tentativa ${(tentativa || 0) + 1}/3] Erro ao verificar item ${itemId}:`,
                error instanceof Error ? error.message : error,
            );
            // Lançar erro para o BullMQ fazer retry
            throw error;
        }
    }

    /**
     * Aprova item após verificação avançada
     * TODO: Implementar atualização no banco
     */
    private async aprovarItem(itemId: string) {
        this.logger.debug(`Aprovando item ${itemId}`);
        // TODO: this.itemRepository.atualizarStatus(itemId, 'APROVADO');
    }

    /**
     * Bloqueia item permanentemente
     * TODO: Implementar bloquei
     */
    private async bloquearItem(itemId: string, motivo: string) {
        this.logger.warn(`Bloqueando item ${itemId}: ${motivo}`);
        // TODO: this.itemRepository.atualizarStatus(itemId, 'BLOQUEADO', motivo);
    }

    // ========== TODO: Integrações externas ==========

    // private async verificarComHive(nome: string, descricao: string) {
    //     // Integração com Hive Moderation API
    //     // Detecta PII, toxicidade, etc
    // }

    // private async verificarComML(nome: string, descricao: string) {
    //     // Verificação com modelo de ML local
    // }

    // private async extrairTextoDeImagens(imagensUrls: string[]) {
    //     // OCR para detectar texto em imagens
    //     // Usar Google Vision ou AWS Rekognition
    // }
}
