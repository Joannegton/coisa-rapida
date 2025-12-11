import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAlugueisTable1732982400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS transacoes`);

    await queryRunner.createTable(
      new Table({
        name: 'aluguel',
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
            name: 'item_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'locador_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'locatario_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'snapshot_item_nome',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'snapshot_item_foto_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'snapshot_preco_diaria',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'locador_nome',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'locatario_nome',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'data_inicio',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'data_fim',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'preco_total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'pagamento_pendente',
              'solicitado',
              'confirmado',
              'ativo',
              'devolvido',
              'concluido',
              'cancelado',
              'disputado',
            ],
            default: "'solicitado'",
            isNullable: false,
          },
          {
            name: 'observacoes_locatario',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'motivo_recusa_locador',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'participantes',
            type: 'uuid',
            isArray: true,
            default: 'ARRAY[]::uuid[]',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'NOW()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `CREATE INDEX idx_aluguel_item_id ON transacoes.aluguel (item_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_aluguel_locador_id ON transacoes.aluguel (locador_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_aluguel_locatario_id ON transacoes.aluguel (locatario_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_aluguel_status ON transacoes.aluguel (status, "createdAt" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_aluguel_periodo ON transacoes.aluguel (data_inicio, data_fim)`,
    );

    // Índice GIN (não suportado diretamente pelo TypeORM)
    await queryRunner.query(
      `CREATE INDEX idx_aluguel_participantes ON transacoes.aluguel USING GIN (participantes)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transacoes.alugueis', true);
  }
}
