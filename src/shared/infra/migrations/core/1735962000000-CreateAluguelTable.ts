import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAluguelTable1735962000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS core`);

        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA core`,
        );
        await queryRunner.query(`
            CREATE TYPE core.aluguel_status AS ENUM (
                'pagamento_pendente',
                'solicitado',
                'confirmado',
                'ativo',
                'devolvido',
                'concluido',
                'cancelado',
                'disputado'
            );
        `);

        await queryRunner.query(`
            CREATE TYPE core.caucao_status AS ENUM (
                'aguardando_pagamento',
                'paga',
                'processando',
                'devolvida',
                'cancelada'
            );
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS core.aluguel (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                
                -- Pessoas (Locador e Locatário)
                locador_usuario_id UUID NOT NULL,
                locador_usuario_nome VARCHAR(255) NOT NULL,
                locatario_usuario_id UUID NOT NULL,
                locatario_usuario_nome VARCHAR(255) NOT NULL,
                
                -- Item
                item_id UUID NOT NULL,
                
                -- Snapshot do Item (capturado no momento da criação)
                snapshot_item_id UUID NOT NULL,
                snapshot_item_nome VARCHAR(255) NOT NULL,
                snapshot_item_descricao TEXT,
                snapshot_preco_diaria DECIMAL(10, 2) NOT NULL,
                snapshot_preco_hora DECIMAL(10, 2),
                snapshot_item_foto_url TEXT,
                snapshot_capturado_em TIMESTAMP WITH TIME ZONE NOT NULL,
                snapshot_versao INTEGER DEFAULT 1,
                snapshot_permite_aluguel_hora BOOLEAN DEFAULT FALSE,
                snapshot_dias_minimos_aluguel INTEGER DEFAULT 1,
                snapshot_dias_maximos_aluguel INTEGER DEFAULT 365,
                snapshot_horas_minimas_aluguel INTEGER,
                snapshot_horas_maximas_aluguel INTEGER,
                snapshot_valor_caucao DECIMAL(10, 2),
                snapshot_caucao_obrigatoria BOOLEAN DEFAULT FALSE,
                
                -- Preço Total
                preco_total DECIMAL(10, 2) NOT NULL,
                
                -- Caução (obrigatório quando presente)
                caucao_valor DECIMAL(10, 2),
                caucao_status core.caucao_status DEFAULT 'aguardando_pagamento',
                caucao_data_pagamento TIMESTAMP WITH TIME ZONE,
                caucao_data_devolucao TIMESTAMP WITH TIME ZONE,
                
                -- Multa (obrigatório)
                multa_dias_atraso INTEGER NOT NULL DEFAULT 0,
                multa_multiplicador DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
                multa_valor_diaria_snapshot DECIMAL(10, 2) NOT NULL,
                multa_valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
                multa_calculada_em TIMESTAMP WITH TIME ZONE,
                
                -- Contrato (obrigatório)
                contrato_versao VARCHAR(10) NOT NULL,
                contrato_conteudo_html TEXT NOT NULL,
                contrato_aceite_locador JSONB,
                contrato_aceite_locatario JSONB,
                contrato_criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
                
                -- Datas do Aluguel
                data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
                data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
                
                -- Comunicação (observações e motivos de recusa)
                observacoes_locatario TEXT,
                motivo_recusa_locador TEXT,
                
                -- Status
                status core.aluguel_status DEFAULT 'solicitado' NOT NULL,
                
                -- Timestamps
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_item_id 
            ON core.aluguel (item_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_locador_id 
            ON core.aluguel (locador_usuario_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_locatario_id 
            ON core.aluguel (locatario_usuario_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_status_criado 
            ON core.aluguel (status, criado_em DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_datas 
            ON core.aluguel (data_inicio, data_fim);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_criado_em 
            ON core.aluguel (criado_em DESC);
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION core.update_aluguel_atualizado_em()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_aluguel_atualizado_em ON core.aluguel;
            
            CREATE TRIGGER trigger_update_aluguel_atualizado_em
            BEFORE UPDATE ON core.aluguel
            FOR EACH ROW
            EXECUTE FUNCTION core.update_aluguel_atualizado_em();
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            ADD CONSTRAINT check_data_fim_maior_inicio 
            CHECK (data_fim > data_inicio);
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            ADD CONSTRAINT check_preco_total_positivo 
            CHECK (preco_total >= 0);
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            ADD CONSTRAINT check_dias_atraso_nao_negativo 
            CHECK (multa_dias_atraso >= 0);
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            ADD CONSTRAINT check_multiplicador_positivo 
            CHECK (multa_multiplicador > 0);
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            ADD CONSTRAINT check_valor_caucao_positivo 
            CHECK (caucao_valor IS NULL OR caucao_valor > 0);
        `);

        await queryRunner
            .query(
                `
            ALTER TABLE core.aluguel
            ADD CONSTRAINT fk_aluguel_locador_id
            FOREIGN KEY (locador_usuario_id) 
            REFERENCES usuario.usuario(id) ON DELETE RESTRICT
            DEFERRABLE INITIALLY DEFERRED;
        `,
            )
            .catch(() => {
                console.log(
                    '⚠️  FK para locador_usuario_id não pôde ser criada',
                );
            });

        await queryRunner
            .query(
                `
            ALTER TABLE core.aluguel
            ADD CONSTRAINT fk_aluguel_locatario_id
            FOREIGN KEY (locatario_usuario_id) 
            REFERENCES usuario.usuario(id) ON DELETE RESTRICT
            DEFERRABLE INITIALLY DEFERRED;
        `,
            )
            .catch(() => {
                console.log(
                    '⚠️  FK para locatario_usuario_id não pôde ser criada',
                );
            });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_aluguel_atualizado_em ON core.aluguel;
        `);

        await queryRunner.query(`
            DROP FUNCTION IF EXISTS core.update_aluguel_atualizado_em() CASCADE;
        `);

        // Remover constraints
        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS fk_aluguel_locador_id;
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS fk_aluguel_locatario_id;
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS check_data_fim_maior_inicio;
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS check_preco_total_positivo;
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS check_dias_atraso_nao_negativo;
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS check_multiplicador_positivo;
        `);

        await queryRunner.query(`
            ALTER TABLE core.aluguel
            DROP CONSTRAINT IF EXISTS check_valor_caucao_positivo;
        `);

        // Remover tabela principal
        await queryRunner.query(`
            DROP TABLE IF EXISTS core.aluguel CASCADE;
        `);

        // Remover tipos ENUM
        await queryRunner.query(`
            DROP TYPE IF EXISTS core.aluguel_status;
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS core.caucao_status;
        `);
        console.log('✅ Tabela core.aluguel removida com sucesso');
    }
}
