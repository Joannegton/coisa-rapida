import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsuarioSchema1733961700000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS usuario`);

        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderacao_status') THEN
                    CREATE TYPE usuario.moderacao_status AS ENUM (
                        'pendente',
                        'em_analise',
                        'aprovado',
                        'rejeitado'
                    );
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_comprovante') THEN
                    CREATE TYPE usuario.tipo_comprovante AS ENUM (
                        'conta_luz',
                        'conta_agua',
                        'conta_gas',
                        'extrato_bancario',
                        'contrato_aluguel',
                        'outro'
                    );
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS usuario.usuario (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                usuario_auth_id UUID NOT NULL UNIQUE,
                nome VARCHAR(255) NOT NULL,
                cpf VARCHAR(14) UNIQUE,
                foto_url TEXT,
                telefone VARCHAR(20),
                telefone_verificado BOOLEAN NOT NULL DEFAULT false,
                email_verificado BOOLEAN NOT NULL DEFAULT false,
                verificado BOOLEAN NOT NULL DEFAULT false,
                versao INTEGER NOT NULL DEFAULT 1,
                
                -- Endereço (embedded columns)
                endereco_cep VARCHAR(10),
                endereco_rua VARCHAR(255),
                endereco_numero VARCHAR(20),
                endereco_complemento VARCHAR(255),
                endereco_bairro VARCHAR(100),
                endereco_cidade VARCHAR(100),
                endereco_estado VARCHAR(2),
                endereco_pais VARCHAR(100) DEFAULT 'Brasil',
                endereco_latitude DOUBLE PRECISION,
                endereco_longitude DOUBLE PRECISION,
                
                -- Timestamps
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_usuario_auth_id 
            ON usuario.usuario (usuario_auth_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_cpf 
            ON usuario.usuario (cpf) 
            WHERE cpf IS NOT NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_telefone_verificado 
            ON usuario.usuario (telefone_verificado);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_email_verificado 
            ON usuario.usuario (email_verificado);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_verificado 
            ON usuario.usuario (verificado);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_criado_em
            ON usuario.usuario (criado_em DESC);
        `);

        await queryRunner.query(`
            ALTER TABLE usuario.usuario
            ADD CONSTRAINT fk_usuario_usuario_auth 
            FOREIGN KEY (usuario_auth_id) 
            REFERENCES auth.usuario_auth(id) 
            ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION usuario.update_atualizado_em()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_atualizado_em ON usuario.usuario;
            
            CREATE TRIGGER trigger_update_atualizado_em
            BEFORE UPDATE ON usuario.usuario
            FOR EACH ROW
            EXECUTE FUNCTION usuario.update_atualizado_em();
        `);

        console.log('✅ Schema usuario e tabela usuario criados com sucesso');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_atualizado_em ON usuario.usuario;
        `);

        await queryRunner.query(`
            DROP FUNCTION IF EXISTS usuario.update_atualizado_em() CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE IF EXISTS usuario.usuario 
            DROP CONSTRAINT IF EXISTS fk_usuario_usuario_auth;
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS usuario.usuario CASCADE;
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS usuario.tipo_comprovante CASCADE;
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS usuario.moderacao_status CASCADE;
        `);

        await queryRunner.query(`
            DROP SCHEMA IF EXISTS usuario CASCADE;
        `);

        console.log('✅ Schema usuario removido com sucesso');
    }
}
