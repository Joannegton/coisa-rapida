import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, BaseEntity, OneToOne, OneToMany } from 'typeorm';
import { StatusAluguel } from '../../domain/Aluguel';
import { CaucaoModel } from './Caucao.model';
import { TransferenciaModel } from './Transferencia.model';
import { v4 as uuidv4 } from 'uuid';

type AluguelModelProps = {
    id: string;
    item: {
        id: string;
        nome: string;
        descricao?: string;
    };
    locatario: {
        id: string;
        nome: string;
        email: string;
        contaMPId?: string;
    };
    locador: {
        id: string;
        nome: string;
        email: string;
        contaMPId?: string;
    };
    caucao?: CaucaoModel;
    valorAluguel: number;
    taxaAppPercentual: number;
    status: StatusAluguel;
    criadoEm: Date;
    atualizadoEm: Date;
    mpPaymentId?: string;
    indenizacao?: number;
    finalizadoEm?: Date;
    transferencias: TransferenciaModel[];
};

@Entity('aluguel')
export class AluguelModel extends BaseEntity implements AluguelModelProps {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ type: 'jsonb' })
    item: {
        id: string;
        nome: string;
        descricao?: string;
    };

    @Column({ type: 'jsonb' })
    locatario: {
        id: string;
        nome: string;
        email: string;
        contaMPId?: string;
    };

    @Column({ type: 'jsonb' })
    locador: {
        id: string;
        nome: string;
        email: string;
        contaMPId?: string;
    };

    @OneToOne(() => CaucaoModel, { nullable: true, cascade: true, onDelete: 'CASCADE' })
    caucao: CaucaoModel;

    @OneToMany(() => TransferenciaModel, (transferencia) => transferencia.aluguel, { cascade: true, eager: true, onDelete: 'CASCADE' })
    transferencias: TransferenciaModel[];

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    valorAluguel: number;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.1 })
    taxaAppPercentual: number;

    @Column({
        type: 'enum',
        enum: StatusAluguel,
        default: StatusAluguel.AGUARDANDO_CAUCAO,
    })
    @Index()
    status: StatusAluguel;

    @Column({ type: 'varchar', nullable: true })
    mpPaymentId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    indenizacao?: number;

    @CreateDateColumn()
    criadoEm: Date;

    @UpdateDateColumn()
    atualizadoEm: Date;

    @Column({ type: 'timestamp', nullable: true })
    finalizadoEm?: Date;

    static criar(props: Omit<AluguelModelProps, 'criadoEm' | 'atualizadoEm'> & { id?: string }): AluguelModel {
        const aluguel = new AluguelModel();
        aluguel.id = props.id || uuidv4();
        Object.assign(aluguel, props);
        return aluguel;
    }
}
