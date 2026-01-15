import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { UsuarioModel } from './Usuario.model';
import { v4 as uuidv4 } from 'uuid';

export enum ModeracaoStatus {
  PENDENTE = 'pendente',
  EM_ANALISE = 'em_analise',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
}

interface VerificacaoResidenciaModelProps {
  id: string;
  comprovanteUrl: string;
  tipoComprovante: string;
  status: ModeracaoStatus;
  observacoesUsuario?: string;
  motivoRejeicao?: string;
  dataConclusao?: Date;
  usuario: UsuarioModel;
  observacoesModerador?: string;
  moderadorId?: string;
}

@Entity('verificacao_residencia')
export class VerificacaoResidenciaModel extends BaseEntity implements VerificacaoResidenciaModelProps {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => UsuarioModel, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuarioModel;

  @Column({ name: 'comprovante_url' })
  comprovanteUrl: string;

  @Column({ name: 'tipo_comprovante' })
  tipoComprovante: string;

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

  static criar(props: Omit<VerificacaoResidenciaModelProps, 'id' | 'status' | 'dataSubmissao' | 'dataConclusao'>): VerificacaoResidenciaModel {
    const instance = new this();
    instance.id = uuidv4();
    Object.assign(instance, props);
    return instance;
  }
}
