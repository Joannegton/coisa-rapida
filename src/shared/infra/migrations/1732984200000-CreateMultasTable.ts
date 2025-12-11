import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMultasTable1732984200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'multas',
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
            name: 'dias_atraso',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'multiplicador',
            type: 'decimal',
            precision: 3,
            scale: 2,
            default: '1.5',
            isNullable: false,
          },
          {
            name: 'valor_diaria',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'valor_multa',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0',
            isNullable: false,
          },
          {
            name: 'aluguel_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'calculadaEm',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // FK para aluguel (1:1)
    await queryRunner.query(`
      ALTER TABLE transacoes.multas
      ADD CONSTRAINT fk_multas_aluguel
      FOREIGN KEY (aluguel_id) REFERENCES transacoes.aluguel(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    // Índices
    await queryRunner.query(
      `CREATE INDEX idx_multas_aluguel_id ON transacoes.multas (aluguel_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE IF EXISTS transacoes.multas DROP CONSTRAINT IF EXISTS fk_multas_aluguel`,
    );
    await queryRunner.dropTable('transacoes.multas', true);
  }
}
