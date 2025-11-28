import { Entity, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BaseEntity, PrimaryColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { EnderecoModel } from './Endereco.model';
import { VerificacaoResidenciaModel } from './VerificacaoResidencia.model';

type UsuarioModelProps = {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  fotoUrl?: string;
  endereco: EnderecoModel;
  emailVerificado: boolean;
  chavePix?: string;
  telefoneVerificado?: boolean;
  enderecoVerificado?: boolean;
  verificado: boolean;
  ativo?: boolean;
  bloqueado?: boolean;
  motivoBloqueio?: string;
  reputacao?: number;
  totalAvaliacoes?: number;
  totalAlugueisComoLocador?: number;
  totalAlugueisComoLocatario?: number;
  totalItensCadastrados?: number;
  criadoEm: Date;
  atualizadoEm: Date;
};

@Entity('usuarios')
export class UsuarioModel extends BaseEntity implements UsuarioModelProps {
  @PrimaryColumn('text')
  id: string;

  // Dados pessoais
  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  cpf?: string;

  @Column({ nullable: true })
  chavePix?: string;

  @Column({ name: 'foto_url', nullable: true })
  fotoUrl?: string;

  @OneToOne(() => EnderecoModel, endereco => endereco.usuario, { cascade: true, eager: true })
  endereco: EnderecoModel;

  @OneToMany(() => VerificacaoResidenciaModel, verificacao => verificacao.usuario, { cascade: true, eager: false })
  verificacoesResidencia: VerificacaoResidenciaModel[];

  // Status e verificação
  @Column({ name: 'email_verificado', default: false })
  emailVerificado: boolean;

  @Column({ name: 'telefone_verificado', default: false })
  telefoneVerificado: boolean;

  @Column({ name: 'endereco_verificado', default: false })
  enderecoVerificado: boolean;

  @Column({ default: false })
  verificado: boolean; // Todas verificações completas

  @Column({ default: true })
  ativo: boolean;

  @Column({ default: false })
  bloqueado: boolean;

  @Column({ name: 'motivo_bloqueio', nullable: true })
  motivoBloqueio?: string;

  // Reputação (denormalizado para performance)
  @Column({ name: 'reputacao', type: 'decimal', precision: 3, scale: 2, default: 0.0, nullable: true })
  reputacao: number;

  @Column({ name: 'total_avaliacoes', default: 0, nullable: true })
  totalAvaliacoes?: number;

  // Estatísticas (denormalizado)
  @Column({ name: 'total_alugueis_como_locador', default: 0, nullable: true })
  totalAlugueisComoLocador?: number;

  @Column({ name: 'total_alugueis_como_locatario', default: 0, nullable: true })
  totalAlugueisComoLocatario?: number;

  @Column({ name: 'total_itens_cadastrados', default: 0, nullable: true })
  totalItensCadastrados?: number;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;

  static criar(props: Omit<UsuarioModelProps, 'criadoEm' | 'atualizadoEm'>): UsuarioModel {
    const usuario = new UsuarioModel();
    Object.assign(usuario, props);
    return usuario;
  }
}
