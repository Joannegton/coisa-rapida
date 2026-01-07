import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAluguelViews1735962200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // View com estatísticas de aluguéis por locador
        await queryRunner.query(`
            CREATE OR REPLACE VIEW core.v_estatisticas_locador AS
            SELECT 
                locador_usuario_id as usuario_id,
                locador_usuario_nome as usuario_nome,
                COUNT(*) as total_alugueis,
                COUNT(CASE WHEN status = 'ativo' THEN 1 END) as alugueis_ativos,
                COUNT(CASE WHEN status = 'concluido' THEN 1 END) as alugueis_concluidos,
                COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as alugueis_cancelados,
                COUNT(CASE WHEN status = 'disputado' THEN 1 END) as alugueis_disputados,
                SUM(CASE WHEN status IN ('concluido', 'ativo', 'confirmado') THEN preco_total ELSE 0 END)::DECIMAL(15, 2) as receita_total,
                AVG(CASE WHEN status IN ('concluido', 'ativo', 'confirmado') THEN preco_total END)::DECIMAL(10, 2) as preco_medio,
                MIN(criado_em) as primeiro_aluguel,
                MAX(criado_em) as ultimo_aluguel
            FROM core.aluguel
            GROUP BY locador_usuario_id, locador_usuario_nome;
        `);

        // View com estatísticas de aluguéis por locatário
        await queryRunner.query(`
            CREATE OR REPLACE VIEW core.v_estatisticas_locatario AS
            SELECT 
                locatario_usuario_id as usuario_id,
                locatario_usuario_nome as usuario_nome,
                COUNT(*) as total_alugueis,
                COUNT(CASE WHEN status = 'ativo' THEN 1 END) as alugueis_ativos,
                COUNT(CASE WHEN status = 'concluido' THEN 1 END) as alugueis_concluidos,
                COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as alugueis_cancelados,
                COUNT(CASE WHEN status = 'disputado' THEN 1 END) as alugueis_disputados,
                SUM(CASE WHEN status IN ('concluido', 'ativo', 'confirmado') THEN preco_total ELSE 0 END)::DECIMAL(15, 2) as gasto_total,
                AVG(CASE WHEN status IN ('concluido', 'ativo', 'confirmado') THEN preco_total END)::DECIMAL(10, 2) as preco_medio,
                MIN(criado_em) as primeiro_aluguel,
                MAX(criado_em) as ultimo_aluguel
            FROM core.aluguel
            GROUP BY locatario_usuario_id, locatario_usuario_nome;
        `);

        // View com aluguéis ativos (próximos a vencer ou já vencidos)
        await queryRunner.query(`
            CREATE OR REPLACE VIEW core.v_alugueis_em_progresso AS
            SELECT 
                id,
                locador_usuario_nome,
                locatario_usuario_nome,
                snapshot_item_nome as item_nome,
                data_inicio,
                data_fim,
                (data_fim - NOW()) as tempo_restante,
                CASE 
                    WHEN NOW() > data_fim THEN 'VENCIDO'
                    WHEN (data_fim - NOW()) <= INTERVAL '2 days' THEN 'EXPIRA_BREVE'
                    ELSE 'EM_PROGRESSO'
                END as urgencia,
                status,
                preco_total
            FROM core.aluguel
            WHERE status IN ('confirmado', 'ativo', 'devolvido')
            ORDER BY data_fim ASC;
        `);

        // View com aluguéis com multas pendentes
        await queryRunner.query(`
            CREATE OR REPLACE VIEW core.v_alugueis_com_multa AS
            SELECT 
                id,
                locador_usuario_nome,
                locatario_usuario_nome,
                snapshot_item_nome as item_nome,
                multa_dias_atraso,
                multa_multiplicador,
                multa_valor_total,
                multa_calculada_em,
                status,
                data_fim,
                NOW() - data_fim as dias_apos_vencimento
            FROM core.aluguel
            WHERE multa_dias_atraso > 0 
            AND status IN ('devolvido', 'concluido', 'disputado')
            ORDER BY multa_valor_total DESC;
        `);

        // View com pagamentos de caução pendentes
        await queryRunner.query(`
            CREATE OR REPLACE VIEW core.v_caucoes_pendentes AS
            SELECT 
                id,
                locador_usuario_nome,
                locatario_usuario_nome,
                snapshot_item_nome as item_nome,
                caucao_valor,
                caucao_status,
                criado_em,
                NOW() - criado_em as dias_aguardando,
                status
            FROM core.aluguel
            WHERE caucao_valor IS NOT NULL 
            AND caucao_status IN ('aguardando_pagamento', 'processando')
            ORDER BY criado_em ASC;
        `);

        // View com receita por período (últimos 30 dias)
        await queryRunner.query(`
            CREATE OR REPLACE VIEW core.v_receita_ultimos_30_dias AS
            SELECT 
                DATE(criado_em) as data,
                COUNT(*) as total_alugueis,
                SUM(CASE WHEN status IN ('concluido', 'ativo', 'confirmado') THEN preco_total ELSE 0 END)::DECIMAL(15, 2) as receita_do_dia,
                AVG(CASE WHEN status IN ('concluido', 'ativo', 'confirmado') THEN preco_total END)::DECIMAL(10, 2) as preco_medio
            FROM core.aluguel
            WHERE criado_em >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(criado_em)
            ORDER BY data DESC;
        `);

        console.log('✅ Views para estatísticas criadas com sucesso');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP VIEW IF EXISTS core.v_receita_ultimos_30_dias;`,
        );
        await queryRunner.query(
            `DROP VIEW IF EXISTS core.v_caucoes_pendentes;`,
        );
        await queryRunner.query(
            `DROP VIEW IF EXISTS core.v_alugueis_com_multa;`,
        );
        await queryRunner.query(
            `DROP VIEW IF EXISTS core.v_alugueis_em_progresso;`,
        );
        await queryRunner.query(
            `DROP VIEW IF EXISTS core.v_estatisticas_locatario;`,
        );
        await queryRunner.query(
            `DROP VIEW IF EXISTS core.v_estatisticas_locador;`,
        );

        console.log('✅ Views removidas com sucesso');
    }
}
