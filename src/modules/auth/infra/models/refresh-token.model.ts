import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { UsuarioAuthModel } from './usuario-auth.model';

@Entity('refresh_tokens', { schema: 'auth' })
@Index(['token'])
@Index(['usuarioAuthId'])
@Index(['expiraEm'])
@Index(['usuarioAuthId', 'revogado'])
export class RefreshTokenModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 500, unique: true })
    token: string;

    @Column({ name: 'usuario_auth_id', type: 'uuid' })
    usuarioAuthId: string;

    @ManyToOne(() => UsuarioAuthModel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_auth_id' })
    usuarioAuth: UsuarioAuthModel;

    @Column({ name: 'expira_em', type: 'timestamp' })
    expiraEm: Date;

    @Column({ type: 'boolean', default: false })
    revogado: boolean;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @Column({ name: 'revogado_em', type: 'timestamp', nullable: true })
    revogadoEm: Date;
}
