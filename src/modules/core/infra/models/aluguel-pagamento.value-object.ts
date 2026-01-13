import { Column } from 'typeorm';

export enum AluguelPagamentoStatusModel {
    AGUARDANDO_PAGAMENTO = 'aguardando_pagamento',
    PAGO = 'pago',
    PROCESSANDO = 'processando',
    RECUSADO = 'recusado',
    CANCELADO = 'cancelado',
}

export class AluguelPagamentoModel {
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        name: 'aluguel_pagamento_valor',
        nullable: true,
    })
    valor?: number;

    @Column({
        type: 'enum',
        enum: AluguelPagamentoStatusModel,
        name: 'aluguel_pagamento_status',
        default: AluguelPagamentoStatusModel.AGUARDANDO_PAGAMENTO,
    })
    status: AluguelPagamentoStatusModel =
        AluguelPagamentoStatusModel.AGUARDANDO_PAGAMENTO;

    @Column({
        type: 'timestamptz',
        name: 'aluguel_data_pagamento',
        nullable: true,
    })
    dataPagamento?: Date;
}
