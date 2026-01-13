import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTransferenciaTable20260113001723
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Tipos ENUM para Transferência
        await queryRunner.query(`
            CREATE TYPE pagamento.tipo_transferencia AS ENUM (
                'pagamento_locador',
                'reembolso_locatario',
                'indenizacao'
            );
        `);

        await queryRunner.query(`
            CREATE TYPE pagamento.status_transferencia AS ENUM (
                'pendente',
                'processando',
                'aguardando_transferencia_manual',
                'concluida',
                'falhou'
            );
        `);

        // Tabela de Transferências
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS pagamento.transferencia (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                -- Relacionamentos
                aluguel_id UUID NOT NULL,
                usuario_id UUID NOT NULL,

                -- Tipo e valor
                tipo pagamento.tipo_transferencia NOT NULL,
                valor DECIMAL(10, 2) NOT NULL,

                -- Status
                status pagamento.status_transferencia DEFAULT 'pendente' NOT NULL,

                -- ID do Mercado Pago
                mercado_pago_transf_id VARCHAR(255),

                -- Descrição e motivo de falha
                descricao VARCHAR(500) NOT NULL,
                motivo_falha VARCHAR(500),

                -- Timestamps
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                completado_em TIMESTAMP WITH TIME ZONE
            );
        `);

        // Índices para Transferências
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_transferencia_aluguel_id
            ON pagamento.transferencia (aluguel_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_transferencia_usuario_id
            ON pagamento.transferencia (usuario_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_transferencia_status
            ON pagamento.transferencia (status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_transferencia_tipo
            ON pagamento.transferencia (tipo);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_transferencia_criado_em
            ON pagamento.transferencia (criado_em DESC);
        `);

        // Função e trigger para updated_at em transferências
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION pagamento.update_transferencia_atualizado_em()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_transferencia_atualizado_em ON pagamento.transferencia;

            CREATE TRIGGER trigger_update_transferencia_atualizado_em
            BEFORE UPDATE ON pagamento.transferencia
            FOR EACH ROW
            EXECUTE FUNCTION pagamento.update_transferencia_atualizado_em();
        `);

        // Constraints para Transferências
        await queryRunner.query(`
            ALTER TABLE pagamento.transferencia
            ADD CONSTRAINT check_transferencia_valor_positivo
            CHECK (valor > 0);
        `);

        // Foreign Keys (com catch para evitar erros se tabelas ainda não existirem)
        await queryRunner
            .query(
                `
            ALTER TABLE pagamento.transferencia
            ADD CONSTRAINT fk_transferencia_aluguel_id
            FOREIGN KEY (aluguel_id)
            REFERENCES core.aluguel(id) ON DELETE RESTRICT
            DEFERRABLE INITIALLY DEFERRED;
        `,
            )
            .catch(() => {
                console.log(
                    '⚠️  FK para transferencia.aluguel_id não pôde ser criada',
                );
            });

        await queryRunner
            .query(
                `
            ALTER TABLE pagamento.transferencia
            ADD CONSTRAINT fk_transferencia_usuario_id
            FOREIGN KEY (usuario_id)
            REFERENCES usuario.usuario(id) ON DELETE RESTRICT
            DEFERRABLE INITIALLY DEFERRED;
        `,
            )
            .catch(() => {
                console.log(
                    '⚠️  FK para transferencia.usuario_id não pôde ser criada',
                );
            });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover trigger
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_transferencia_atualizado_em ON pagamento.transferencia;
        `);

        // Remover função
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS pagamento.update_transferencia_atualizado_em() CASCADE;
        `);

        // Remover constraints
        await queryRunner.query(`
            ALTER TABLE pagamento.transferencia
            DROP CONSTRAINT IF EXISTS fk_transferencia_aluguel_id;
        `);

        await queryRunner.query(`
            ALTER TABLE pagamento.transferencia
            DROP CONSTRAINT IF EXISTS fk_transferencia_usuario_id;
        `);

        await queryRunner.query(`
            ALTER TABLE pagamento.transferencia
            DROP CONSTRAINT IF EXISTS check_transferencia_valor_positivo;
        `);

        // Remover tabela
        await queryRunner.query(`
            DROP TABLE IF EXISTS pagamento.transferencia CASCADE;
        `);

        // Remover tipos ENUM
        await queryRunner.query(`
            DROP TYPE IF EXISTS pagamento.tipo_transferencia;
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS pagamento.status_transferencia;
        `);

        console.log('✅ Tabela de transferências removida com sucesso');
    }
}
