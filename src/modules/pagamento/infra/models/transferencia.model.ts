import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum TipoTransferencia {
    PAGAMENTO_LOCADOR = 'pagamento_locador',
    REEMBOLSO_LOCATARIO = 'reembolso_locatario',
    INDENIZACAO = 'indenizacao',
}

export enum StatusTransferencia {
    PENDENTE = 'pendente',
    PROCESSANDO = 'processando',
    AGUARDANDO_TRANSFERENCIA_MANUAL = 'aguardando_transferencia_manual',
    CONCLUIDA = 'concluida',
    FALHOU = 'falhou',
}

@Entity('transferencia', { schema: 'pagamento' })
@Index(['aluguelId'])
@Index(['usuarioId'])
@Index(['status'])
@Index(['tipo'])
@Index(['criadoEm'])
export class TransferenciaModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    aluguelId: string;

    @Column('uuid')
    usuarioId: string;

    @Column({
        type: 'enum',
        enum: TipoTransferencia,
        comment:
            'Tipo de transferência: PAGAMENTO_LOCADOR, REEMBOLSO_LOCATARIO, INDENIZACAO',
    })
    tipo: TipoTransferencia;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        comment: 'Valor transferido',
    })
    valor: number;

    @Column({
        type: 'enum',
        enum: StatusTransferencia,
        default: StatusTransferencia.PENDENTE,
        comment:
            'Status da transferência: PENDENTE, PROCESSANDO, AGUARDANDO_TRANSFERENCIA_MANUAL, CONCLUIDA, FALHOU',
    })
    status: StatusTransferencia;

    @Column({
        name: 'mercado_pago_transf_id',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'ID da transação no Mercado Pago',
    })
    mercadoPagoTransfId?: string;

    @Column({
        type: 'varchar',
        length: 500,
        comment: 'Descrição da transferência',
    })
    descricao: string;

    @Column({
        name: 'motivo_falha',
        type: 'varchar',
        length: 500,
        nullable: true,
        comment: 'Motivo da falha (se aplicável)',
    })
    motivoFalha?: string;

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
        name: 'completado_em',
        type: 'timestamp with time zone',
        nullable: true,
        comment: 'Data de conclusão',
    })
    completadoEm?: Date;

    static criar(props: Partial<TransferenciaModel>): TransferenciaModel {
        const transferencia = new TransferenciaModel();
        Object.assign(transferencia, props);
        return transferencia;
    }
}
