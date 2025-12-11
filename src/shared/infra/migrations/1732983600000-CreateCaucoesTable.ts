import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateCaucoesTable1732983600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'caucoes',
        schema: 'pagamentos',
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
          },
          {
            name: 'metodo_pagamento',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'transacao_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'valor',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'valor_retido',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0.00',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['bloqueada', 'liberada', 'retida', 'reembolsada'],
            default: "'bloqueada'",
            isNullable: false,
          },
          {
            name: 'motivo_retencao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'data_liberacao',
            type: 'timestamptz',
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

    // Índices essenciais (conforme model)
    await queryRunner.query(
      `CREATE INDEX idx_caucoes_aluguel_id ON pagamentos.caucoes (aluguel_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_caucoes_status ON pagamentos.caucoes (status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_caucoes_transacao_id ON pagamentos.caucoes (transacao_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pagamentos.caucoes', true);
  }
}
