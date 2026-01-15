import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemDisponibilidadeTable1734393900000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(` 
            CREATE TABLE IF NOT EXISTS item.item_disponibilidade (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                item_id UUID NOT NULL UNIQUE REFERENCES item.item(id) ON DELETE CASCADE,
                
                disponivel BOOLEAN DEFAULT TRUE NOT NULL,
                data_disponibilidade TIMESTAMP,
                
                dias_minimos_aluguel INTEGER DEFAULT 1 NOT NULL CHECK (dias_minimos_aluguel > 0),
                dias_maximos_aluguel INTEGER DEFAULT 365 NOT NULL CHECK (dias_maximos_aluguel > 0),
                permite_alugueis_consecutivos BOOLEAN DEFAULT TRUE NOT NULL,
                aprovacao_automatica BOOLEAN DEFAULT FALSE NOT NULL,
                
                -- Bloqueios de datas (JSON array de intervalos com dataInicio, dataFim, motivo)
                -- Formato: [{"dataInicio": "2024-01-01T00:00:00Z", "dataFim": "2024-01-05T23:59:59Z", "motivo": "Manutenção"}]
                datas_bloqueadas JSONB DEFAULT '[]'::jsonb,

                -- Suporte a aluguel por hora
                permite_aluguel_por_hora BOOLEAN DEFAULT FALSE NOT NULL,
                horas_minimos_aluguel INTEGER DEFAULT 1 NOT NULL CHECK (horas_minimos_aluguel > 0),
                horas_maximos_aluguel INTEGER DEFAULT 720 NOT NULL CHECK (horas_maximos_aluguel > 0),
                
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                
                CONSTRAINT check_dias_minimos_menores_maximos 
                CHECK (dias_minimos_aluguel <= dias_maximos_aluguel)
                ,
                CONSTRAINT check_horas_minimos_menores_maximos
                CHECK (horas_minimos_aluguel <= horas_maximos_aluguel),
                
                CONSTRAINT check_datas_bloqueadas_is_array
                CHECK (jsonb_typeof(datas_bloqueadas) = 'array')
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_disponibilidade_item_id 
            ON item.item_disponibilidade(item_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_disponibilidade_disponivel 
            ON item.item_disponibilidade(disponivel);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_disponibilidade_datas_bloqueadas 
            ON item.item_disponibilidade USING GIN(datas_bloqueadas);
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION item.update_disponibilidade_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trg_disponibilidade_atualizado_em
            BEFORE UPDATE ON item.item_disponibilidade
            FOR EACH ROW
            EXECUTE FUNCTION item.update_disponibilidade_timestamp();
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN item.item_disponibilidade.datas_bloqueadas IS 
            'Array JSON de intervalos de datas bloqueadas. Formato: [{"dataInicio": "ISO8601", "dataFim": "ISO8601", "motivo": "string"}]';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS trg_disponibilidade_atualizado_em ON item.item_disponibilidade`,
        );
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS item.update_disponibilidade_timestamp()`,
        );
        await queryRunner.query(
            `DROP TABLE IF EXISTS item.item_disponibilidade CASCADE`,
        );
    }
}
