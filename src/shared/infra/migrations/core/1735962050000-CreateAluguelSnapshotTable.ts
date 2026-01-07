import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAluguelSnapshotTable1735962050000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS core.aluguel_snapshot (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                aluguel_id UUID NOT NULL UNIQUE REFERENCES core.aluguel(id) ON DELETE CASCADE,
                
                -- Snapshot do Item (capturado no momento da criação)
                snapshot_item_id UUID NOT NULL,
                snapshot_item_nome VARCHAR(255) NOT NULL ,
                snapshot_item_descricao TEXT ,
                snapshot_preco_diaria DECIMAL(10, 2) NOT NULL ,
                snapshot_preco_hora DECIMAL(10, 2) ,
                snapshot_item_foto_url TEXT ,
                snapshot_capturado_em TIMESTAMP WITH TIME ZONE NOT NULL ,
                snapshot_versao INTEGER DEFAULT 1,
                snapshot_permite_aluguel_hora BOOLEAN DEFAULT FALSE ,
                snapshot_dias_minimos_aluguel INTEGER DEFAULT 1 ,
                snapshot_dias_maximos_aluguel INTEGER DEFAULT 365 ,
                snapshot_horas_minimas_aluguel INTEGER ,
                snapshot_horas_maximas_aluguel INTEGER ,
                snapshot_valor_caucao DECIMAL(10, 2) ,
                snapshot_caucao_obrigatoria BOOLEAN DEFAULT FALSE ,
                
                -- Observações (dados raramente consultados)
                observacoes_locatario TEXT ,
                motivo_recusa_locador TEXT ,
                
                -- Timestamps
                criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_aluguel_snapshot_aluguel_id 
            ON core.aluguel_snapshot (aluguel_id);
        `);

        console.log('✅ Tabela core.aluguel_snapshot criada com sucesso');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS core.aluguel_snapshot CASCADE;
        `);

        console.log('✅ Tabela core.aluguel_snapshot removida com sucesso');
    }
}
