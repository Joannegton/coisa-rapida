import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComprovanteResidenciaTable1733961800000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS usuario.comprovante_residencia (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                usuario_id UUID NOT NULL UNIQUE,
                comprovante_url TEXT NOT NULL,
                tipo_comprovante usuario.tipo_comprovante NOT NULL,
                status usuario.moderacao_status NOT NULL DEFAULT 'em_analise',
                moderador_id UUID,
                observacoes_usuario TEXT,
                observacoes_moderador TEXT,
                motivo_rejeicao TEXT,
                data_conclusao TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                CONSTRAINT fk_comprovante_usuario 
                    FOREIGN KEY (usuario_id) 
                    REFERENCES usuario.usuario(id) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_comprovante_usuario_id 
            ON usuario.comprovante_residencia (usuario_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_comprovante_status 
            ON usuario.comprovante_residencia (status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_comprovante_tipo 
            ON usuario.comprovante_residencia (tipo_comprovante);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_comprovante_created_at 
            ON usuario.comprovante_residencia (created_at DESC);
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION usuario.update_comprovante_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_comprovante_updated_at ON usuario.comprovante_residencia;
            
            CREATE TRIGGER trigger_update_comprovante_updated_at
            BEFORE UPDATE ON usuario.comprovante_residencia
            FOR EACH ROW
            EXECUTE FUNCTION usuario.update_comprovante_updated_at();
        `);

        console.log('✅ Tabela comprovante_residencia criada com sucesso');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_update_comprovante_updated_at ON usuario.comprovante_residencia;
        `);

        await queryRunner.query(`
            DROP FUNCTION IF EXISTS usuario.update_comprovante_updated_at() CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE IF EXISTS usuario.comprovante_residencia 
            DROP CONSTRAINT IF EXISTS fk_comprovante_usuario;
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS usuario.comprovante_residencia CASCADE;
        `);

        console.log('✅ Tabela comprovante_residencia removida com sucesso');
    }
}
