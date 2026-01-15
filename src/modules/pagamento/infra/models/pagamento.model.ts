import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum StatusPagamento {
    APROVADO = 'aprovado',
    PENDENTE = 'pendente',
    EM_PROCESSAMENTO = 'em_processamento',
    REJEITADO = 'rejeitado',
    CANCELADO = 'cancelado',
    REEMBOLSADO = 'reembolsado',
}

export enum PagamentoTipo {
    ALUGUEL = 'aluguel',
    VENDA = 'venda',
    MULTA = 'multa',
}

@Entity('pagamento', { schema: 'pagamento' })
@Index(['aluguelId'])
@Index(['usuarioId'])
@Index(['status'])
@Index(['mercadoPagoPagamentoId'])
@Index(['criadoEm'])
export class PagamentoModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'aluguel_id', type: 'uuid' })
    aluguelId: string;

    @Column({ name: 'usuario_id', type: 'uuid' })
    usuarioId: string;

    @Column({
        type: 'enum',
        enum: PagamentoTipo,
        comment: 'Tipo do pagamento: aluguel, venda, multa, etc.',
    })
    tipo: PagamentoTipo;

    @Column({
        name: 'mercado_pago_pagamento_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'ID do pagamento no Mercado Pago',
    })
    mercadoPagoPagamentoId?: string;

    @Column({
        name: 'mercado_pago_preferencia_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'ID da preference no Mercado Pago',
    })
    mercadoPagoPreferenciaId?: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Valor do pagamento',
    })
    valor: number;

    @Column({
        type: 'enum',
        enum: StatusPagamento,
        comment:
            'Status do pagamento conforme Mercado Pago: APROVADO, PENDENTE, EM_PROCESSAMENTO, REJEITADO, CANCELADO, REEMBOLSADO',
    })
    status: StatusPagamento;

    @Column({
        name: 'metodo_pagamento',
        type: 'varchar',
        length: 100,
        comment: 'Método de pagamento utilizado',
    })
    metodoPagamento: string;

    @Column({
        name: 'dados_mercado_pago',
        type: 'jsonb',
        nullable: true,
        comment: 'Dados completos retornados pela API do Mercado Pago',
    })
    dadosMercadoPago?: Record<string, any>;

    @Column({
        name: 'motivo_rejeicao',
        type: 'varchar',
        length: 500,
        nullable: true,
        comment: 'Motivo da rejeição (se aplicável)',
    })
    motivoRejeicao?: string;

    @CreateDateColumn({
        name: 'criado_em',
        type: 'timestamp with time zone',
    })
    criadoEm: Date;

    @UpdateDateColumn({
        name: 'atualizado_em',
        type: 'timestamp with time zone',
    })
    atualizadoEm: Date;

    @Column({
        name: 'aprovado_em',
        type: 'timestamp with time zone',
        nullable: true,
        comment: 'Data de aprovação',
    })
    aprovadoEm?: Date;

    static criar(props: Partial<PagamentoModel>): PagamentoModel {
        const pagamento = new PagamentoModel();
        Object.assign(pagamento, props);
        return pagamento;
    }
}
