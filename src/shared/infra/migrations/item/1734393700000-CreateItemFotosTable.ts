import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemFotosTable1734393700000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS item.item_fotos (
                id UUID NOT NULL PRIMARY KEY,
                item_id UUID NOT NULL REFERENCES item.item(id) ON DELETE CASCADE,
                url TEXT NOT NULL,
                ordem INTEGER DEFAULT 0 NOT NULL,
                principal BOOLEAN DEFAULT FALSE NOT NULL,
                nome_arquivo VARCHAR(100),
                tamanho_bytes INTEGER CHECK (tamanho_bytes >= 0),
                
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                
                CONSTRAINT check_ordem_positiva CHECK (ordem >= 0)
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_fotos_item_id 
            ON item.item_fotos(item_id);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_fotos_principal 
            ON item.item_fotos(item_id, principal);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS item.item_fotos CASCADE`);
    }
}
