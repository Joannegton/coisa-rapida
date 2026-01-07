import { Column } from 'typeorm';

export class SnapshotItemModel {
    @Column({
        name: 'snapshot_item_id',
        type: 'uuid',
        comment: 'ID do item no momento do aluguel',
    })
    itemId: string;

    @Column({
        name: 'snapshot_item_nome',
        type: 'varchar',
        length: 255,
        comment: 'Nome do item capturado no momento da criação',
    })
    nome: string;

    @Column({
        name: 'snapshot_item_descricao',
        type: 'text',
        nullable: true,
        comment: 'Descrição do item capturada (opcional)',
    })
    descricao?: string;

    @Column({
        name: 'snapshot_preco_diaria',
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Preço da diária no momento do aluguel (imutável)',
    })
    precoDiaria: number;

    @Column({
        name: 'snapshot_preco_hora',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        comment: 'Preço por hora no momento do aluguel (se aplicável)',
    })
    precoHora?: number;

    @Column({
        name: 'snapshot_item_foto_url',
        type: 'text',
        nullable: true,
        comment: 'URL da foto principal do item (para histórico/exibição)',
    })
    fotoUrl?: string;

    @Column({
        name: 'snapshot_capturado_em',
        type: 'timestamp',
        comment:
            'Data/hora em que o snapshot foi capturado (criação do aluguel)',
    })
    capturadoEm: Date;

    @Column({
        name: 'snapshot_versao',
        type: 'integer',
        default: 1,
        comment: 'Versão do snapshot (incrementa se item é re-capturado)',
    })
    versao: number;

    @Column({
        name: 'snapshot_permite_aluguel_hora',
        type: 'boolean',
        default: false,
        comment: 'Indica se este item permite aluguel por hora',
    })
    permiteAluguelPorHora: boolean;

    @Column({
        name: 'snapshot_dias_minimos_aluguel',
        type: 'integer',
        default: 1,
        comment: 'Dias mínimos de aluguel configurados no momento da criação',
    })
    diasMinimosAluguel: number;

    @Column({
        name: 'snapshot_dias_maximos_aluguel',
        type: 'integer',
        default: 365,
        comment: 'Dias máximos de aluguel configurados no momento da criação',
    })
    diasMaximosAluguel: number;

    @Column({
        name: 'snapshot_horas_minimas_aluguel',
        type: 'integer',
        nullable: true,
        comment: 'Horas mínimas de aluguel (se aluguel por hora)',
    })
    horasMinimosAluguel?: number;

    @Column({
        name: 'snapshot_horas_maximas_aluguel',
        type: 'integer',
        nullable: true,
        comment: 'Horas máximas de aluguel (se aluguel por hora)',
    })
    horasMaximosAluguel?: number;

    @Column({
        name: 'snapshot_valor_caucao',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        comment: 'Valor da caução configurada no momento da criação',
    })
    valorCaucao?: number;

    @Column({
        name: 'snapshot_caucao_obrigatoria',
        type: 'boolean',
        default: false,
        comment: 'Indica se caução era obrigatória',
    })
    caucaoObrigatoria: boolean;

    static criar(props: Partial<SnapshotItemModel>): SnapshotItemModel {
        const snapshot = new SnapshotItemModel();
        Object.assign(snapshot, {
            capturadoEm: new Date(),
            versao: 1,
            ...props,
        });
        return snapshot;
    }
}
