import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm';

export enum StatusOutboxEvent {
    PENDENTE = 'PENDING',
    PUBLICADO = 'PUBLISHED',
    FALHADO = 'FAILED',
}

@Entity({ schema: 'core', name: 'outbox_events' })
export class OutboxEventModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tipo_evento', type: 'varchar', length: 255 })
    tipoEvento: string;

    @Column({ name: 'id_agregado', type: 'varchar', length: 255 })
    idAgregado: string;

    @Column({ name: 'tipo_agregado', type: 'varchar', length: 100 })
    tipoAgregado: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, any>;

    @Column({
        type: 'varchar',
        length: 50,
        default: StatusOutboxEvent.PENDENTE,
    })
    status: StatusOutboxEvent;

    @Column({ name: 'quantidade_tentativas', type: 'int', default: 0 })
    quantidadeTentativas: number;

    @Column({ name: 'mensagem_erro', type: 'text', nullable: true })
    mensagemErro?: string;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @Column({ name: 'publicado_em', type: 'timestamp', nullable: true })
    publicadoEm?: Date;

    static criar(props: {
        tipoEvento: string;
        idAgregado: string;
        tipoAgregado: string;
        payload: Record<string, any>;
    }): OutboxEventModel {
        const evento = new OutboxEventModel();
        evento.tipoEvento = props.tipoEvento;
        evento.idAgregado = props.idAgregado;
        evento.tipoAgregado = props.tipoAgregado;
        evento.payload = props.payload;
        evento.status = StatusOutboxEvent.PENDENTE;
        evento.quantidadeTentativas = 0;
        return evento;
    }
}
