import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePagamentoTable20260113001200 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS pagamento`);

        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA pagamento`,
        );

        // Tipos ENUM para Pagamento
        await queryRunner.query(`
            CREATE TYPE pagamento.status_pagamento AS ENUM (
                'aprovado',
                'pendente',
                'em_processamento',
                'rejeitado',
                'cancelado',
                'reembolsado'
            );
        `);

        await queryRunner.query(`
            CREATE TYPE pagamento.pagamento_tipo AS ENUM (
                'aluguel',
                'caucao',
                'venda',
                'multa'
            );
        `);

        // Tabela de Pagamentos
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS pagamento.pagamento (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                -- Relacionamentos
                aluguel_id UUID NOT NULL,
                usuario_id UUID NOT NULL,

                -- Tipo e valor
                tipo pagamento.pagamento_tipo NOT NULL,
                valor DECIMAL(10, 2) NOT NULL,

                -- Status
                status pagamento.status_pagamento DEFAULT 'pendente' NOT NULL,

                -- Método de pagamento
                metodo_pagamento VARCHAR(100) NOT NULL,

                -- IDs do Mercado Pago
                mercado_pago_pagamento_id VARCHAR(255),
                mercado_pago_preferencia_id VARCHAR(255),

                -- Dados completos do Mercado Pago
                dados_mercado_pago JSONB,

                -- Motivo de rejeição (opcional)
                motivo_rejeicao VARCHAR(500),

                -- Timestamps
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                aprovado_em TIMESTAMP WITH TIME ZONE
            );
        `);

        // Índices para Pagamentos
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pagamentos_aluguel_id
            ON pagamento.pagamento (aluguel_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id
            ON pagamento.pagamento (usuario_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pagamentos_status
            ON pagamento.pagamento (status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pagamentos_mercado_pago_pagamento_id
            ON pagamento.pagamento (mercado_pago_pagamento_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pagamentos_criado_em
            ON pagamento.pagamento (criado_em DESC);
        `);

        // Função e trigger para updated_at em pagamentos
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION pagamento.update_pagamentos_atualizado_em()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_pagamentos_atualizado_em ON pagamento.pagamento;

            CREATE TRIGGER trigger_update_pagamentos_atualizado_em
            BEFORE UPDATE ON pagamento.pagamento
            FOR EACH ROW
            EXECUTE FUNCTION pagamento.update_pagamentos_atualizado_em();
        `);

        // Constraints para Pagamentos
        await queryRunner.query(`
            ALTER TABLE pagamento.pagamento
            ADD CONSTRAINT check_pagamentos_valor_positivo
            CHECK (valor > 0);
        `);

        // Foreign Keys (com catch para evitar erros se tabelas ainda não existirem)
        await queryRunner
            .query(
                `
            ALTER TABLE pagamento.pagamento
            ADD CONSTRAINT fk_pagamentos_aluguel_id
            FOREIGN KEY (aluguel_id)
            REFERENCES core.aluguel(id) ON DELETE RESTRICT
            DEFERRABLE INITIALLY DEFERRED;
        `,
            )
            .catch(() => {
                console.log(
                    '⚠️  FK para pagamento.aluguel_id não pôde ser criada',
                );
            });

        await queryRunner
            .query(
                `
            ALTER TABLE pagamento.pagamento
            ADD CONSTRAINT fk_pagamentos_usuario_id
            FOREIGN KEY (usuario_id)
            REFERENCES usuario.usuario(id) ON DELETE RESTRICT
            DEFERRABLE INITIALLY DEFERRED;
        `,
            )
            .catch(() => {
                console.log(
                    '⚠️  FK para pagamento.usuario_id não pôde ser criada',
                );
            });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover trigger
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_pagamentos_atualizado_em ON pagamento.pagamento;
        `);

        // Remover função
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS pagamento.update_pagamentos_atualizado_em() CASCADE;
        `);

        // Remover constraints
        await queryRunner.query(`
            ALTER TABLE pagamento.pagamento
            DROP CONSTRAINT IF EXISTS fk_pagamentos_aluguel_id;
        `);

        await queryRunner.query(`
            ALTER TABLE pagamento.pagamento
            DROP CONSTRAINT IF EXISTS fk_pagamentos_usuario_id;
        `);

        await queryRunner.query(`
            ALTER TABLE pagamento.pagamento
            DROP CONSTRAINT IF EXISTS check_pagamentos_valor_positivo;
        `);

        // Remover tabela
        await queryRunner.query(`
            DROP TABLE IF EXISTS pagamento.pagamento CASCADE;
        `);

        // Remover tipos ENUM
        await queryRunner.query(`
            DROP TYPE IF EXISTS pagamento.status_pagamento;
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS pagamento.pagamento_tipo;
        `);

        console.log('✅ Tabela de pagamentos removida com sucesso');
    }
}
