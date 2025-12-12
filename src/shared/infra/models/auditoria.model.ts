import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('auditoria')
export class AuditoriaModel {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'timestamp' })
    timestamp: Date;

    @Column({ name: 'usuario_id', nullable: true })
    usuarioId: string;

    @Column({ name: 'usuario_email', nullable: true })
    usuarioEmail: string;

    @Column({ nullable: true })
    modulo: string;

    @Column()
    acao: string;

    @Column()
    recurso: string;

    @Column({ name: 'recurso_id', nullable: true })
    recursoId: string;

    @Column({ nullable: true })
    descricao: string;

    @Column()
    nivel: 'baixo' | 'medio' | 'alto' | 'critico';

    @Column({ nullable: true })
    metodo: string;

    @Column({ nullable: true })
    rota: string;

    @Column({ nullable: true })
    ip: string;

    @Column({ name: 'user_agent', nullable: true })
    userAgent: string;

    @Column({ name: 'status_code', nullable: true })
    statusCode: number;

    @Column({ name: 'duracao_ms', nullable: true })
    duracaoMs: number;

    @Column({ nullable: true })
    erro: string;

    @Column({ name: 'estado_antes', type: 'jsonb', nullable: true })
    estadoAntes: any;

    @Column({ name: 'estado_depois', type: 'jsonb', nullable: true })
    estadoDepois: any;

    @Column({ type: 'jsonb', nullable: true })
    mudancas: Array<{
        campo: string;
        valorAntes: any;
        valorDepois: any;
    }>;
}
