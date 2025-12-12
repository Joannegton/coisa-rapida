import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity({ schema: 'auth', name: 'usuario_auth_auditoria' })
@Index(['usuarioId'])
@Index(['criadoEm'])
export class UsuarioAuthAuditoria {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'usuario_id', type: 'uuid' })
    usuarioId: string;

    @Column({ length: 50 })
    acao: string;

    @Column({ name: 'dados_antigos', type: 'jsonb', nullable: true })
    dadosAntigos?: any;

    @Column({ name: 'dados_novos', type: 'jsonb', nullable: true })
    dadosNovos?: any;

    @Column({ name: 'usuario_responsavel', type: 'uuid', nullable: true })
    usuarioResponsavel?: string;

    @Column({ name: 'ip_address', length: 45, nullable: true })
    ipAddress?: string;

    @Column({ type: 'text', nullable: true })
    userAgent?: string;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;
}