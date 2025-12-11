import { UsuarioModel } from 'src/modules/novos/usuario/infra/models/usuario.model';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';

@Entity('usuario_auth')
@Index(['email'], { unique: true })
@Index(['createdAt'])
export class UsuarioAuthModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false, select: false })
  hashSenha: string;

  @Column({ type: 'timestamp', nullable: true })
  dataUltimoLogin: Date;

  @Column({ type: 'integer', default: 0 })
  tentativasFalhas: number;

  @Column({ type: 'timestamp', nullable: true })
  bloqueadoAte: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => UsuarioModel, (usuario) => usuario.auth)
  usuario: UsuarioModel;
}
