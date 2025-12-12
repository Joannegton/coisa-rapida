import { UsuarioModel } from 'src/modules/usuario/infra/models/usuario.model';
import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
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

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    @OneToOne(() => UsuarioModel, (usuario) => usuario.auth, { nullable: true })
    usuario: UsuarioModel;

    static criar(props: Partial<UsuarioAuthModel>): UsuarioAuthModel {
        const usuarioAuth = new UsuarioAuthModel();
        Object.assign(usuarioAuth, props);
        return usuarioAuth;
    }
}
