import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemModeracaoTable1734393800000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(` 
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderacao_status' AND typnamespace = 'item'::regnamespace) THEN
                    CREATE TYPE item.moderacao_status AS ENUM (
                        'pendente',
                        'em_analise',
                        'aprovado',
                        'rejeitado',
                        'bloqueado'
                    );
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS item.item_moderacao (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_id UUID NOT NULL UNIQUE REFERENCES item.item(id) ON DELETE CASCADE,
                status item.moderacao_status DEFAULT 'pendente' NOT NULL,
                
                contem_palavras_proibidas BOOLEAN,
                contem_links_externos BOOLEAN,
                contem_telefone BOOLEAN,
                requer_aprovacao_manual BOOLEAN DEFAULT FALSE,
                
                motivo_bloqueio TEXT,
                moderador_id UUID,
                observacoes_moderacao TEXT,
                
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                data_resolucao TIMESTAMP
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_moderacao_item_id 
            ON item.item_moderacao(item_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_moderacao_status 
            ON item.item_moderacao(status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_moderacao_criado_em 
            ON item.item_moderacao(criado_em);
        `);

        // Trigger para atualizar atualizado_em
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION item.update_moderacao_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trg_moderacao_atualizado_em
            BEFORE UPDATE ON item.item_moderacao
            FOR EACH ROW
            EXECUTE FUNCTION item.update_moderacao_timestamp();
        `);

        // Comentários
        await queryRunner.query(`
            COMMENT ON TABLE item.item_moderacao IS 
            'Controle de moderação de itens. Relação 1:1 com item.item.';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS trg_moderacao_atualizado_em ON item.item_moderacao`,
        );
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS item.update_moderacao_timestamp()`,
        );
        await queryRunner.query(
            `DROP TABLE IF EXISTS item.item_moderacao CASCADE`,
        );
        await queryRunner.query(`DROP TYPE IF EXISTS item.moderacao_status`);
    }
}
