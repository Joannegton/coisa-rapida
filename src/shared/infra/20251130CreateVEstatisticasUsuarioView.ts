import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVEstatisticasUsuarioView20251130
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_catalog.pg_views
          WHERE schemaname = 'usuarios' AND viewname = 'v_estatisticas_usuario'
        ) THEN
          EXECUTE $$
            CREATE VIEW usuarios.v_estatisticas_usuario AS
            SELECT
              u.id as usuario_id,
              COUNT(CASE WHEN a.locador_id = u.id THEN 1 END) as total_alugueis_como_locador,
              COUNT(CASE WHEN a.locatario_id = u.id THEN 1 END) as total_alugueis_como_locatario,
              COUNT(i.id) as total_itens_alugados,
              COUNT(av.id) as total_avaliacoes
            FROM usuarios.usuarios u
            LEFT JOIN transacoes.alugueis a ON u.id = a.locador_id OR u.id = a.locatario_id
            LEFT JOIN catalogo.itens i ON u.id = i.proprietario_id
            LEFT JOIN reputacao.avaliacoes av ON u.id = av.avaliado_id
            GROUP BY u.id;
          $$;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_catalog.pg_views
          WHERE schemaname = 'usuarios' AND viewname = 'v_estatisticas_usuario'
        ) THEN
          EXECUTE 'DROP VIEW IF EXISTS usuarios.v_estatisticas_usuario CASCADE';
        END IF;
      END
      $$;
    `);
  }
}
