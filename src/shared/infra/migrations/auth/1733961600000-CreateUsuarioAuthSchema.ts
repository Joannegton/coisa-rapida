import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsuarioAuthSchema1733961600000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS auth`);

        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA auth;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS auth.usuario_auth (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) NOT NULL UNIQUE,
                hash_senha VARCHAR(255) NOT NULL,
                data_ultimo_login TIMESTAMP WITH TIME ZONE,
                role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'MODERADOR', 'ADMIN')),
                reset_senha_token VARCHAR(255),
                reset_senha_expiracao TIMESTAMP WITH TIME ZONE,
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_auth_email 
            ON auth.usuario_auth (email);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_auth_criado_em 
            ON auth.usuario_auth (criado_em DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_auth_role 
            ON auth.usuario_auth (role);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usuario_auth_reset_token 
            ON auth.usuario_auth (reset_senha_token);
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION auth.update_atualizado_em()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_atualizado_em ON auth.usuario_auth;
            
            CREATE TRIGGER trigger_update_atualizado_em
            BEFORE UPDATE ON auth.usuario_auth
            FOR EACH ROW
            EXECUTE FUNCTION auth.update_atualizado_em();
        `);

        console.log('✅ Schema auth e tabelas criadas com sucesso');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_atualizado_em ON auth.usuario_auth;
        `);

        await queryRunner.query(`
            DROP FUNCTION IF EXISTS auth.update_atualizado_em() CASCADE;
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS auth.usuario_auth CASCADE;
        `);

        await queryRunner.query(`
            DROP SCHEMA IF EXISTS auth CASCADE;
        `);

        console.log('✅ Schema auth removido com sucesso');
    }
}
