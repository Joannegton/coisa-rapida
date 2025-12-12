import { UsuarioModel } from 'src/modules/usuario/infra/models/usuario.model';
import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';

export enum ModeracaoStatus {
    PENDENTE = 'pendente',
    EM_ANALISE = 'em_analise',
    APROVADO = 'aprovado',
    REJEITADO = 'rejeitado',
}

export enum TipoComprovante {
    CONTA_LUZ = 'conta_luz',
    CONTA_AGUA = 'conta_agua',
    CONTA_GAS = 'conta_gas',
    EXTRATO_BANCARIO = 'extrato_bancario',
    CONTRATO_ALUGUEL = 'contrato_aluguel',
    OUTRO = 'outro',
}

@Entity('comprovante_residencia', { schema: 'usuario' })
export class ComprovanteResidenciaModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'comprovante_url' })
    comprovanteUrl: string;

    @Column({ name: 'tipo_comprovante' })
    tipoComprovante: TipoComprovante;

    @Column({
        type: 'enum',
        enum: ModeracaoStatus,
        default: ModeracaoStatus.EM_ANALISE,
    })
    status: ModeracaoStatus;

    @Column({ name: 'moderador_id', nullable: true })
    moderadorId?: string;

    @Column({ name: 'observacoes_usuario', type: 'text', nullable: true })
    observacoesUsuario?: string;

    @Column({ name: 'observacoes_moderador', type: 'text', nullable: true })
    observacoesModerador?: string;

    @Column({ name: 'motivo_rejeicao', type: 'text', nullable: true })
    motivoRejeicao?: string;

    // Datas

    @Column({ name: 'data_conclusao', type: 'timestamp', nullable: true })
    dataConclusao?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToOne(() => UsuarioModel, (usuario) => usuario.comprovanteResidencia)
    @JoinColumn({ name: 'usuario_id', referencedColumnName: 'id' })
    usuario: UsuarioModel;
}
