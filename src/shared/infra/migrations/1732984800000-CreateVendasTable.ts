import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateVendasTable1732984800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vendas',
        schema: 'vendas',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'item_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'item_nome',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'item_foto_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'vendedor_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'comprador_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'vendedor_nome',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'comprador_nome',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'snapshot_valor_pago',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'transacao_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'metodo_pagamento',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'status_pagamento',
            type: 'enum',
            enum: ['pendente', 'pago', 'cancelado', 'reembolsado'],
            default: "'pendente'",
            isNullable: false,
          },
          {
            name: 'data_pagamento',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Índices essenciais conforme model
    await queryRunner.query(
      `CREATE INDEX idx_vendas_item_id ON vendas.vendas (item_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vendas_vendedor_id ON vendas.vendas (vendedor_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vendas_comprador_id ON vendas.vendas (comprador_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vendas_status ON vendas.vendas (status_pagamento)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vendas.vendas', true);
  }
}
