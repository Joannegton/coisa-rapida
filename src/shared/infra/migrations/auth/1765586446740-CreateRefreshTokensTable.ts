import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1765586446740
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(500) NOT NULL UNIQUE,
                usuario_auth_id UUID NOT NULL,
                expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
                revogado BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                revogado_em TIMESTAMP WITH TIME ZONE,
                CONSTRAINT fk_refresh_token_usuario_auth 
                    FOREIGN KEY (usuario_auth_id) 
                    REFERENCES auth.usuario_auth(id) 
                    ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token 
            ON auth.refresh_tokens(token);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario 
            ON auth.refresh_tokens(usuario_auth_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires 
            ON auth.refresh_tokens(expira_em);

            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario_revogado 
            ON auth.refresh_tokens(usuario_auth_id, revogado);
        `);

        console.log('✅ Tabela refresh_tokens criada com sucesso');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS auth.idx_refresh_tokens_usuario_revogado;
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS auth.idx_refresh_tokens_expires;
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS auth.idx_refresh_tokens_usuario;
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS auth.idx_refresh_tokens_token;
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS auth.refresh_tokens CASCADE;
        `);

        console.log('✅ Tabela refresh_tokens removida com sucesso');
    }
}
