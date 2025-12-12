// src/contrato-aluguel/entities/contrato-aluguel.entity.ts
import { Aluguel } from 'src/modules/legacy/seguranca/domain/Aluguel';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export interface AceiteContrato {
    assinaturaDigital: string; // Hash da assinatura
    dataHora: Date;
    enderecoIp: string;
    userAgent: string;
    latitude?: number;
    longitude?: number;
}
@Entity({ name: 'contratos_aluguel', schema: 'transacoes' })
@Index('idx_contratos_aluguel_id', ['aluguelId'])
@Index('idx_contratos_legado', ['contratoIdLegado'])
export class ContratoAluguel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'aluguel_id' })
    aluguelId: string;

    @Column({ length: 10, name: 'versao_contrato' })
    versaoContrato: string;

    @Column({ type: 'text', name: 'conteudo_html' })
    conteudoHtml: string;

    @Column({ type: 'jsonb', name: 'aceite_locador', nullable: true })
    aceiteLocador?: AceiteContrato;

    @Column({ type: 'jsonb', name: 'aceite_locatario', nullable: true })
    aceiteLocatario?: AceiteContrato;

    @OneToOne(() => Aluguel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'aluguel_id' })
    aluguel: Aluguel;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
