import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditoriaTable1765563060463 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE auditoria (
                id SERIAL PRIMARY KEY,
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
                mudancas JSONB
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE auditoria;`);
    }
}
