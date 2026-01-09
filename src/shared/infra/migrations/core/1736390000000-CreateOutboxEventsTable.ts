import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxEventsTable1736390000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Cria tabela outbox_events em core (mesmo schema que domínio)
        // Garante atomicidade transacional
        await queryRunner.query(`
            CREATE TABLE core.outbox_events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                tipo_evento VARCHAR(255) NOT NULL,
                id_agregado VARCHAR(255) NOT NULL,
                tipo_agregado VARCHAR(100) NOT NULL,
                payload JSONB NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
                quantidade_tentativas INTEGER NOT NULL DEFAULT 0,
                mensagem_erro TEXT,
                criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
                publicado_em TIMESTAMP
            );
        `);

        // Índices para performance
        await queryRunner.query(`
            CREATE INDEX idx_outbox_status ON core.outbox_events(status) 
            WHERE status = 'PENDENTE';
        `);

        await queryRunner.query(`
            CREATE INDEX idx_outbox_criado_em ON core.outbox_events(criado_em);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_outbox_agregado ON core.outbox_events(id_agregado, tipo_agregado);
        `);

        await queryRunner.query(`
            COMMENT ON TABLE core.outbox_events IS 'Outbox Pattern - Armazena eventos para publicação garantida. Mesmo schema que domínio para atomicidade transacional';
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN core.outbox_events.status IS 'PENDENTE: aguardando publicação | PUBLICADO: publicado com sucesso | FALHADO: falhou após 5 tentativas';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS core.outbox_events`);
    }
}
