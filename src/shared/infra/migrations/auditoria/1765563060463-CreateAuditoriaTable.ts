import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para criar tabela de auditoria com particionamento e índices otimizados
 * Cria partições apenas para dezembro 2025 (mês atual) e 2026-2027 (futuro)
 */
export class CreateAuditoriaTable1765563060463 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar tabela particionada
        await queryRunner.query(`
            CREATE TABLE auditoria (
                id SERIAL NOT NULL,
                timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                usuario_id VARCHAR(255),
                usuario_email VARCHAR(255),
                modulo VARCHAR(100),
                acao VARCHAR(255) NOT NULL,
                recurso VARCHAR(255) NOT NULL,
                recurso_id VARCHAR(255),
                descricao TEXT,
                nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('baixo', 'medio', 'alto', 'critico')),
                metodo VARCHAR(10),
                rota VARCHAR(500),
                ip VARCHAR(45),
                user_agent TEXT,
                status_code INTEGER,
                duracao_ms INTEGER,
                erro TEXT,
                estado_antes JSONB,
                estado_depois JSONB,
                mudancas JSONB,
                PRIMARY KEY (id, timestamp)
            ) PARTITION BY RANGE (timestamp);
        `);

        // Dezembro 2025 (mês atual)
        await queryRunner.query(`
            CREATE TABLE auditoria_2025_dez PARTITION OF auditoria
            FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
        `);

        const months2026 = [
            { name: 'jan', start: '01-01', end: '02-01' },
            { name: 'fev', start: '02-01', end: '03-01' },
            { name: 'mar', start: '03-01', end: '04-01' },
            { name: 'abr', start: '04-01', end: '05-01' },
            { name: 'mai', start: '05-01', end: '06-01' },
            { name: 'jun', start: '06-01', end: '07-01' },
            { name: 'jul', start: '07-01', end: '08-01' },
            { name: 'ago', start: '08-01', end: '09-01' },
            { name: 'set', start: '09-01', end: '10-01' },
            { name: 'out', start: '10-01', end: '11-01' },
            { name: 'nov', start: '11-01', end: '12-01' },
            { name: 'dez', start: '12-01', end: '01-01' },
        ];

        for (const month of months2026) {
            const nextMonth = month.name === 'dez' ? '01-01' : month.end;
            const nextYear = month.name === 'dez' ? 2027 : 2026;

            await queryRunner.query(`
                CREATE TABLE auditoria_2026_${month.name} PARTITION OF auditoria
                FOR VALUES FROM ('2026-${month.start}') TO ('${nextYear}-${nextMonth}');
            `);
        }

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp 
            ON auditoria(timestamp DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id 
            ON auditoria(usuario_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp_acao 
            ON auditoria(timestamp DESC, acao);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_auditoria_nivel 
            ON auditoria(nivel) 
            WHERE nivel IN ('alto', 'critico');
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_timestamp 
            ON auditoria(modulo, timestamp DESC);
        `);

        // função para auto-criar partições
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION criar_particao_auditoria()
            RETURNS void AS $$
            DECLARE
                data_inicio DATE;
                data_fim DATE;
                nome_particao TEXT;
            BEGIN
                -- Calcular próximo mês
                data_inicio := date_trunc('month', CURRENT_DATE + interval '1 month');
                data_fim := data_inicio + interval '1 month';
                nome_particao := 'auditoria_' || to_char(data_inicio, 'YYYY_MM');
                
                -- Criar partição se não existir
                EXECUTE format(
                    'CREATE TABLE IF NOT EXISTS %I PARTITION OF auditoria FOR VALUES FROM (%L) TO (%L)',
                    nome_particao,
                    data_inicio,
                    data_fim
                );
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Comentários para documentação
        await queryRunner.query(`
            COMMENT ON TABLE auditoria IS 'Tabela particionada de auditoria. Novas partições são criadas mensalmente.';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS criar_particao_auditoria();`,
        );

        await queryRunner.query(`DROP TABLE IF EXISTS auditoria CASCADE;`);
    }
}
