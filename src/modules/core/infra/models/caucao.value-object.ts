import { Column } from 'typeorm';

export enum StatusCaucao {
    AGUARDANDO_PAGAMENTO = 'aguardando_pagamento',
    PAGA = 'paga',
    PROCESSANDO = 'processando',
    DEVOLVIDA = 'devolvida',
    CANCELADA = 'cancelada',
}

export class CaucaoModel {
    @Column({
        name: 'caucao_valor',
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Valor da caução paga pelo locatário (escrow)',
    })
    valor: number;

    @Column({
        name: 'caucao_status',
        type: 'enum',
        enum: StatusCaucao,
        default: StatusCaucao.AGUARDANDO_PAGAMENTO,
        comment:
            'Estado atual da caução (aguardando_pagamento, paga, processando, devolvida, cancelada)',
    })
    status: StatusCaucao;

    @Column({
        name: 'caucao_data_pagamento',
        type: 'timestamp',
        nullable: true,
        comment:
            'Data/hora em que a caução foi paga (confirmado via Mercado Pago)',
    })
    dataPagamento?: Date;

    @Column({
        name: 'caucao_data_devolucao',
        type: 'timestamp',
        nullable: true,
        comment: 'Data/hora em que a caução foi devolvida ao locatário',
    })
    dataDevolucao?: Date;

    static criar(props: Partial<CaucaoModel>): CaucaoModel {
        const caucao = new CaucaoModel();
        Object.assign(caucao, {
            status: StatusCaucao.AGUARDANDO_PAGAMENTO,
            ...props,
        });
        return caucao;
    }
}
