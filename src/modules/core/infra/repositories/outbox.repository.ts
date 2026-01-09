import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';
import { OutboxEvent } from '../../domain/outbox-event';
import { OutboxEventMapper } from '../mappers/outbox-event.mapper';
import {
    OutboxEventModel,
    StatusOutboxEvent,
} from '../models/outbox-event.model';

@Injectable()
export class OutboxRepository {
    private readonly logger = new Logger(OutboxRepository.name);

    constructor(
        @InjectRepository(OutboxEventModel)
        private readonly repository: Repository<OutboxEventModel>,
        private readonly mapper: OutboxEventMapper,
    ) {}

    /**
     * Salva evento na outbox (dentro de uma transação externa)
     */
    async salvar(evento: OutboxEvent, manager?: EntityManager): Promise<void> {
        const modelo = OutboxEventMapper.toModel(evento);
        const repo = manager
            ? manager.getRepository(OutboxEventModel)
            : this.repository;
        await repo.save(modelo);
    }

    /**
     * Busca eventos pendentes para publicação
     * Limita a 100 eventos por vez para não sobrecarregar
     */
    async buscarPendentes(limite = 100): Promise<OutboxEvent[]> {
        const modelos = await this.repository.find({
            where: {
                status: StatusOutboxEvent.PENDENTE,
            },
            order: {
                criadoEm: 'ASC', // Ordem cronológica (FIFO)
            },
            take: limite,
        });

        return modelos.map((modelo) => OutboxEventMapper.toDomain(modelo));
    }

    /**
     * Marca evento como publicado
     */
    async marcarComoPublicado(eventId: string): Promise<void> {
        await this.repository.update(eventId, {
            status: StatusOutboxEvent.PUBLICADO,
            publicadoEm: new Date(),
        });
    }

    /**
     * Registra falha na publicação (para retry)
     */
    async registrarFalha(eventId: string, mensagemErro: string): Promise<void> {
        const event = await this.repository.findOne({
            where: { id: eventId },
        });

        if (!event) return;

        const quantidadeTentativas = event.quantidadeTentativas + 1;
        const limiteTentativas = 5;

        // Após 5 tentativas, marca como FAILED definitivamente
        if (quantidadeTentativas >= limiteTentativas) {
            await this.repository.update(eventId, {
                status: StatusOutboxEvent.FALHADO,
                quantidadeTentativas,
                mensagemErro: `[${quantidadeTentativas}x] ${mensagemErro}`,
            });
            this.logger.error(
                `Evento ${eventId} falhou após ${limiteTentativas} tentativas`,
            );
        } else {
            // Incrementa contador de retry, mantém PENDING
            await this.repository.update(eventId, {
                quantidadeTentativas,
                mensagemErro: `[${quantidadeTentativas}x] ${mensagemErro}`,
            });
        }
    }

    /**
     * Busca eventos que falharam para investigação
     */
    async buscarFalhados(): Promise<OutboxEvent[]> {
        const modelos = await this.repository.find({
            where: {
                status: StatusOutboxEvent.FALHADO,
            },
            order: {
                criadoEm: 'DESC',
            },
        });

        return modelos.map((modelo) => OutboxEventMapper.toDomain(modelo));
    }

    /**
     * Limpa eventos publicados há mais de X dias (manutenção)
     */
    async limparEventosAntigos(diasAntigos = 30): Promise<number> {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasAntigos);

        const resultado = await this.repository.delete({
            status: StatusOutboxEvent.PUBLICADO,
            publicadoEm: LessThan(dataLimite),
        });

        const deletados = resultado.affected || 0;
        this.logger.log(
            `🧹 Limpeza: ${deletados} eventos publicados removidos (>${diasAntigos} dias)`,
        );

        return deletados;
    }
}
