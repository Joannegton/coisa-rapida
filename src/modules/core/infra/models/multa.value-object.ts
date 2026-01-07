import { Column } from 'typeorm';

export class MultaModel {
    @Column({
        name: 'multa_dias_atraso',
        type: 'integer',
        comment: 'Quantidade de dias em atraso na devolução',
    })
    diasAtraso: number;

    @Column({
        name: 'multa_multiplicador',
        type: 'decimal',
        precision: 3,
        scale: 2,
        comment:
            'Multiplicador da multa (1.5x, 2.0x, etc). 50% = 0.5 do valor diário',
    })
    multiplicador: number;

    @Column({
        name: 'multa_valor_diaria_snapshot',
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Snapshot do valor da diária no momento do cálculo da multa',
    })
    valorDiariaSnapshot: number;

    @Column({
        name: 'multa_valor_total',
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment:
            'Valor total da multa calculado (multiplicador × valor_diaria × dias_atraso)',
    })
    valorTotal: number;

    @Column({
        name: 'multa_calculada_em',
        type: 'timestamp',
        nullable: true,
        comment: 'Data/hora em que a multa foi calculada',
    })
    calculadaEm?: Date;

    static criar(props: Partial<MultaModel>): MultaModel {
        const multa = new MultaModel();
        Object.assign(multa, {
            ...props,
        });
        return multa;
    }
}
