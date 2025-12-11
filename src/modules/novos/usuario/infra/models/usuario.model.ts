import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  VersionColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { EnderecoModel } from './endereco.value-objct';
import { UsuarioAuthModel } from '../../../auth/infra/models/usuario-auth.model';
import { ComprovanteResidenciaModel } from './comprovante-residencia.model';

@Entity('usuario')
@Index(['cpf'], { unique: true })
@Index(['email'], { unique: true })
@Index(['createdAt'])
export class UsuarioModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UsuarioAuthModel, (auth) => auth.usuario)
  auth?: UsuarioAuthModel;

  @VersionColumn()
  versao: number;

  @Column({ type: 'varchar', length: 14, unique: true, nullable: false })
  cpf: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nome: string;

  @Column({ type: 'text', nullable: true })
  fotoUrl?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  telefone: string;

  @Column({ name: 'telefone_verificado', type: 'boolean', default: false })
  telefoneVerificado: boolean;

  @Column({ name: 'email_verificado', type: 'boolean', default: false })
  emailVerificado: boolean;

  @Column({ type: 'boolean', default: false })
  verificado: boolean; // se telefone, email e endereco

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @Column(() => EnderecoModel, { prefix: 'endereco' })
  endereco: EnderecoModel;

  @OneToOne(
    () => ComprovanteResidenciaModel,
    (comprovante) => comprovante.usuario,
  )
  comprovanteResidencia?: ComprovanteResidenciaModel;
}
