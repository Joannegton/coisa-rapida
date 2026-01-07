import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItemTableSchema1734393600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS item`);

        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA item`,
        );

        await queryRunner.query(
            `CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public`,
        );

        // Configura o search_path para encontrar os tipos e funções do PostGIS
        await queryRunner.query(`
            DO $$
            DECLARE
                postgis_schema TEXT;
            BEGIN
                -- Encontra o schema onde PostGIS está instalado
                SELECT n.nspname INTO postgis_schema
                FROM pg_extension e
                JOIN pg_namespace n ON e.extnamespace = n.oid
                WHERE e.extname = 'postgis';
                
                IF postgis_schema IS NOT NULL THEN
                    -- Configura o search_path para incluir o schema do PostGIS
                    EXECUTE format('SET search_path TO item, %I, public', postgis_schema);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_item' AND typnamespace = 'item'::regnamespace) THEN
                    CREATE TYPE item.categoria_item AS ENUM (
                        'ELETRONICOS',
                        'FERRAMENTAS',
                        'ESPORTES',
                        'EVENTOS',
                        'MODA',
                        'MOBILIAS',
                        'VEICULOS',
                        'LIVROS_MIDIAS',
                        'OUTROS'
                    );
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_item' AND typnamespace = 'item'::regnamespace) THEN
                    CREATE TYPE item.estado_item AS ENUM (
                        'NOVO',
                        'COMO_NOVO',
                        'BOM',
                        'REGULAR',
                        'PARA_CONSERTAR'
                    );
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_anuncio' AND typnamespace = 'item'::regnamespace) THEN
                    CREATE TYPE item.tipo_anuncio AS ENUM (
                        'ALUGUEL',
                        'VENDA',
                        'AMBOS'
                    );
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_item' AND typnamespace = 'item'::regnamespace) THEN
                    CREATE TYPE item.status_item AS ENUM (
                        'RASCUNHO',
                        'PENDENTE',
                        'ATIVO',
                        'INATIVO',
                        'ARQUIVADO',
                        'EXCLUIDO'
                    );
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS item.item (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                usuario_id UUID NOT NULL REFERENCES usuario.usuario(id) ON DELETE CASCADE,
                
                nome VARCHAR(255) NOT NULL,
                descricao TEXT NOT NULL,
                categoria item.categoria_item DEFAULT 'OUTROS' NOT NULL,
                estado item.estado_item DEFAULT 'BOM' NOT NULL,
                tipo_anuncio item.tipo_anuncio DEFAULT 'ALUGUEL' NOT NULL,
                status item.status_item DEFAULT 'RASCUNHO' NOT NULL,
                
                -- Preços (value object PrecosItemModel)
                preco_por_dia DECIMAL(10,2) NOT NULL CHECK (preco_por_dia >= 0),
                preco_por_hora DECIMAL(10,2) CHECK (preco_por_hora >= 0),
                valor_caucao DECIMAL(10,2) CHECK (valor_caucao >= 0),
                caucao_obrigatoria BOOLEAN DEFAULT FALSE NOT NULL,
                
                -- Localização (value object LocalizacaoItemModel)
                localizacao_lat DOUBLE PRECISION NOT NULL,
                localizacao_lng DOUBLE PRECISION NOT NULL,
                localizacao_endereco VARCHAR(500) NOT NULL,
                localizacao_cidade VARCHAR(100) NOT NULL,
                localizacao_estado VARCHAR(2) NOT NULL,
                localizacao_cep VARCHAR(10) NOT NULL,
                ponto geography(Point, 4326) GENERATED ALWAYS AS (
                    ST_SetSRID(ST_MakePoint(localizacao_lng, localizacao_lat), 4326)::geography
                ) STORED,
                
                -- Estatísticas
                alugueis_totais INTEGER DEFAULT 0 NOT NULL CHECK (alugueis_totais >= 0),
                
                -- Busca Full-Text Search (PostgreSQL tsvector para português)
                vetor_busca tsvector GENERATED ALWAYS AS (
                    to_tsvector('portuguese', coalesce(nome, '') || ' ' || coalesce(descricao, ''))
                ) STORED,
                
                -- Controle de versão e timestamps
                versao INTEGER DEFAULT 1 NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                data_arquivamento TIMESTAMP,
                data_exclusao TIMESTAMP,
                
                CONSTRAINT check_lat_range CHECK (localizacao_lat BETWEEN -90 AND 90),
                CONSTRAINT check_lng_range CHECK (localizacao_lng BETWEEN -180 AND 180)
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_usuario_status 
            ON item.item(usuario_id, status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_categoria_status 
            ON item.item(categoria, status);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_criado_em 
            ON item.item(criado_em);
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_atualizado_em 
            ON item.item(atualizado_em);
        `);

        // Índice espacial GiST para consultas geográficas no value object de localização
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_ponto 
            ON item.item USING GIST(ponto);
        `);

        // Índice GiST para Full-Text Search (busca por texto em português)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_item_vetor_busca 
            ON item.item USING GIST(vetor_busca);
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION item.update_item_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.atualizado_em = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trg_item_atualizado_em
            BEFORE UPDATE ON item.item
            FOR EACH ROW
            EXECUTE FUNCTION item.update_item_timestamp();
        `);

        // Comentários para documentação
        await queryRunner.query(`
            COMMENT ON COLUMN item.item.ponto IS 
            'Campo geography(Point,4326) gerado automaticamente a partir de localizacao_lng/localizacao_lat. Usado para consultas espaciais com índice GiST.';
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN item.item.vetor_busca IS 
            'Campo tsvector gerado automaticamente com Full-Text Search para português. Tokeniza e stemiza nome + descricao para buscas semânticas rápidas (50-100x mais rápido que LIKE).';
        `);

        await queryRunner.query(`
            COMMENT ON INDEX item.idx_item_ponto IS 
            'Índice espacial GiST para consultas de proximidade (ST_DWithin, ST_Distance). Essencial para performance em buscas geográficas.';
        `);

        await queryRunner.query(`
            COMMENT ON INDEX item.idx_item_vetor_busca IS 
            'Índice GiST para Full-Text Search em português. Permite buscas semânticas com plainto_tsquery() e ranking com ts_rank(). Performance: O(log n) vs O(n) do LIKE.';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS trg_item_atualizado_em ON item.item`,
        );
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS item.update_item_timestamp()`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS item.item CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS item.status_item`);
        await queryRunner.query(`DROP TYPE IF EXISTS item.tipo_anuncio`);
        await queryRunner.query(`DROP TYPE IF EXISTS item.estado_item`);
        await queryRunner.query(`DROP TYPE IF EXISTS item.categoria_item`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS postgis CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS item CASCADE`);
    }
}
