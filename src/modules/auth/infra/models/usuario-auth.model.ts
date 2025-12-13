import { UsuarioModel } from 'src/modules/usuario/infra/models/usuario.model';
import { RefreshTokenModel } from './refresh-token.model';
import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';

@Entity('usuario_auth', { schema: 'auth' })
@Index(['email'], { unique: true })
@Index(['criadoEm'])
export class UsuarioAuthModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
    email: string;

    @Column({
        name: 'hash_senha',
        type: 'varchar',
        length: 255,
        nullable: false,
        select: false,
    })
    hashSenha: string;

    @Column({ name: 'data_ultimo_login', type: 'timestamp', nullable: true })
    dataUltimoLogin?: Date;

    @Column({
        type: 'varchar',
        length: 20,
        default: 'USER',
    })
    role: 'USER' | 'MODERADOR' | 'ADMIN';

    @Column({
        name: 'reset_senha_token',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    resetSenhaToken?: string;

    @Column({
        name: 'reset_senha_expiracao',
        type: 'timestamp',
        nullable: true,
    })
    resetSenhaExpiracao?: Date;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    @OneToOne(() => UsuarioModel, (usuario) => usuario.auth, { nullable: true })
    usuario: UsuarioModel;

    @OneToMany(() => RefreshTokenModel, (token) => token.usuarioAuth)
    refreshTokens: RefreshTokenModel[];

    static criar(props: Partial<UsuarioAuthModel>): UsuarioAuthModel {
        const usuarioAuth = new UsuarioAuthModel();
        Object.assign(usuarioAuth, props);
        return usuarioAuth;
    }
}
