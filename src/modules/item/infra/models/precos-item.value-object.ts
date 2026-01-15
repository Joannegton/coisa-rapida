import { Column } from 'typeorm';

export class PrecosItemModel {
    @Column({
        name: 'preco_por_dia',
        type: 'decimal',
        precision: 10,
        scale: 2,
        unsigned: true,
    })
    precoPorDia: number;

    @Column({
        name: 'preco_por_hora',
        type: 'decimal',
        precision: 10,
        scale: 2,
        unsigned: true,
        nullable: true,
    })
    precoPorHora?: number;

    @Column({
        name: 'valor_caucao',
        type: 'decimal',
        precision: 10,
        scale: 2,
        unsigned: true,
        nullable: true,
    })
    valorCaucao?: number;

    @Column({
        name: 'caucao_obrigatoria',
        type: 'boolean',
        default: false,
    })
    caucaoObrigatoria: boolean;

    static criar(props: Partial<PrecosItemModel>): PrecosItemModel {
        const precos = new PrecosItemModel();
        Object.assign(precos, props);
        return precos;
    }
}
