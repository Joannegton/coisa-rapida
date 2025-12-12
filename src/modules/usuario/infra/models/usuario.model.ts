import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    VersionColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { EnderecoModel } from './endereco.value-objct';
import { UsuarioAuthModel } from '../../../auth/infra/models/usuario-auth.model';
import { ComprovanteResidenciaModel } from './comprovante-residencia.model';

@Entity('usuario', { schema: 'usuario' })
@Index(['cpf'], { unique: true })
@Index(['criadoEm'])
export class UsuarioModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => UsuarioAuthModel, (auth) => auth.usuario, {
        nullable: true,
    })
    @JoinColumn({ name: 'usuario_auth_id' })
    auth?: UsuarioAuthModel;

    @VersionColumn()
    versao: number;

    @Column({ type: 'varchar', length: 14, unique: true, nullable: true })
    cpf?: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    nome: string;

    @Column({ name: 'foto_url', type: 'text', nullable: true })
    fotoUrl?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefone?: string;

    @Column({ name: 'telefone_verificado', type: 'boolean', default: false })
    telefoneVerificado: boolean;

    @Column({ name: 'email_verificado', type: 'boolean', default: false })
    emailVerificado: boolean;

    @Column({ type: 'boolean', default: false })
    verificado: boolean;

    @CreateDateColumn({ name: 'criado_em' })
    criadoEm: Date;

    @UpdateDateColumn({ name: 'atualizado_em' })
    atualizadoEm: Date;

    @Column(() => EnderecoModel, { prefix: false })
    endereco: EnderecoModel;

    @OneToOne(
        () => ComprovanteResidenciaModel,
        (comprovante) => comprovante.usuario,
    )
    comprovanteResidencia?: ComprovanteResidenciaModel;

    static criar(props: Partial<UsuarioModel>): UsuarioModel {
        const usuario = new UsuarioModel();
        Object.assign(usuario, props);
        return usuario;
    }
}
