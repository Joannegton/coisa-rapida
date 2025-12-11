import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateContratosAluguelTable1732983000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'contratos_aluguel',
        schema: 'transacoes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'aluguel_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'versao_contrato',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'conteudo_html',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'aceite_locador',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'aceite_locatario',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'contrato_id_legado',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      ALTER TABLE transacoes.contratos_aluguel
      ADD CONSTRAINT fk_contratos_aluguel_aluguel
      FOREIGN KEY (aluguel_id) REFERENCES transacoes.aluguel(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_contratos_aluguel_id ON transacoes.contratos_aluguel (aluguel_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_contratos_legado ON transacoes.contratos_aluguel (contrato_id_legado)`,
    );

    // Índices GIN para pesquisa dentro do JSONB
    await queryRunner.query(
      `CREATE INDEX idx_contratos_aceite_locador ON transacoes.contratos_aluguel USING GIN (aceite_locador)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_contratos_aceite_locatario ON transacoes.contratos_aluguel USING GIN (aceite_locatario)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS transacoes.contratos_aluguel DROP CONSTRAINT IF EXISTS fk_contratos_aluguel_aluguel`,
    );
    await queryRunner.dropTable('transacoes.contratos_aluguel', true);
  }
}
