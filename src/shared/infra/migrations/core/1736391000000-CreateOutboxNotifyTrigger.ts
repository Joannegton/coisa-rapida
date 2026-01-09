import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 🔔 Migration: Trigger LISTEN/NOTIFY para Outbox Pattern
 *
 * Cria função e trigger que notificam automaticamente quando
 * um novo evento é inserido na tabela core.outbox_events.
 *
 * Isso elimina a necessidade de pooling a cada 5 segundos,
 * permitindo publicação em tempo real (~100ms latency).
 *
 */
export class CreateOutboxNotifyTrigger1736391000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Cria função que notifica quando evento é inserido
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION core.notificar_novo_evento_outbox()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Envia notificação com ID e tipo do evento
                PERFORM pg_notify(
                    'outbox_events',
                    json_build_object(
                        'id', NEW.id,
                        'tipo_evento', NEW.tipo_evento,
                        'id_agregado', NEW.id_agregado
                    )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 2. Cria trigger que executa a função após INSERT
        await queryRunner.query(`
            CREATE TRIGGER trigger_notificar_outbox_events
            AFTER INSERT ON core.outbox_events
            FOR EACH ROW
            EXECUTE FUNCTION core.notificar_novo_evento_outbox();
        `);

        // 3. Adiciona comentários para documentação
        await queryRunner.query(`
            COMMENT ON FUNCTION core.notificar_novo_evento_outbox() IS 
            'Notifica aplicação NestJS em tempo real quando novo evento é inserido na outbox. Usado para LISTEN/NOTIFY pattern.';
        `);

        await queryRunner.query(`
            COMMENT ON TRIGGER trigger_notificar_outbox_events ON core.outbox_events IS 
            'Trigger que executa notificação automática para publicação de eventos em tempo real (latência ~100ms).';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_notificar_outbox_events ON core.outbox_events;
        `);

        await queryRunner.query(`
            DROP FUNCTION IF EXISTS core.notificar_novo_evento_outbox();
        `);
    }
}
