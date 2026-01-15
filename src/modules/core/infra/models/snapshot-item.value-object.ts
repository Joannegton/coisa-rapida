import { Column } from 'typeorm';

export class SnapshotItemModel {
    @Column({
        name: 'item_nome_snapshot',
        type: 'varchar',
        length: 255,
        comment: 'Nome do item capturado no momento da criação',
    })
    nome: string;

    @Column({
        name: 'item_descricao_snapshot',
        type: 'text',
        nullable: true,
        comment: 'Descrição do item capturada (opcional)',
    })
    descricao?: string;

    @Column({
        name: 'item_preco_diaria_snapshot',
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Preço da diária no momento do aluguel (imutável)',
    })
    precoDiaria: number;

    @Column({
        name: 'item_preco_hora_snapshot',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        comment: 'Preço por hora no momento do aluguel (se aplicável)',
    })
    precoHora?: number;

    @Column({
        name: 'item_foto_url_snapshot',
        type: 'text',
        comment: 'URL da foto principal do item (para histórico/exibição)',
    })
    fotoUrl?: string;

    @Column({
        name: 'item_capturado_em_snapshot',
        type: 'timestamp',
        comment:
            'Data/hora em que o snapshot foi capturado (criação do aluguel)',
    })
    capturadoEm: Date;

    @Column({
        name: 'item_versao_snapshot',
        type: 'integer',
        comment: 'Versão do snapshot (incrementa se item é re-capturado)',
    })
    versao: number;

    @Column({
        name: 'item_permite_aluguel_hora_snapshot',
        type: 'boolean',
        comment: 'Indica se este item permite aluguel por hora',
    })
    permiteAluguelPorHora: boolean;

    @Column({
        name: 'item_dias_minimos_aluguel_snapshot',
        type: 'integer',
        default: 1,
        comment: 'Dias mínimos de aluguel configurados no momento da criação',
    })
    diasMinimosAluguel: number;

    @Column({
        name: 'item_dias_maximos_aluguel_snapshot',
        type: 'integer',
        default: 365,
        comment: 'Dias máximos de aluguel configurados no momento da criação',
    })
    diasMaximosAluguel: number;

    @Column({
        name: 'item_horas_minimas_aluguel_snapshot',
        type: 'integer',
        nullable: true,
        comment: 'Horas mínimas de aluguel (se aluguel por hora)',
    })
    horasMinimosAluguel?: number;

    @Column({
        name: 'item_horas_maximas_aluguel_snapshot',
        type: 'integer',
        nullable: true,
        comment: 'Horas máximas de aluguel (se aluguel por hora)',
    })
    horasMaximosAluguel?: number;

    @Column({
        name: 'item_valor_caucao_snapshot',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        comment: 'Valor da caução configurada no momento da criação',
    })
    valorCaucao?: number;

    @Column({
        name: 'item_caucao_obrigatoria_snapshot',
        type: 'boolean',
        comment: 'Indica se caução era obrigatória',
    })
    caucaoObrigatoria: boolean;

    static criar(props: Partial<SnapshotItemModel>): SnapshotItemModel {
        const snapshot = new SnapshotItemModel();
        Object.assign(snapshot, {
            capturadoEm: new Date(),
            ...props,
        });
        return snapshot;
    }
}
