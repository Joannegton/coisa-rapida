import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, BaseEntity, OneToOne } from 'typeorm';
import { StatusCaucao, MetodoPagamento } from '../../domain/Caucao';
import { AluguelModel } from './Aluguel.model';
import { v4 as uuidv4 } from 'uuid';

type CaucaoModelProps = {
    paymentId: string;
    valor: number;
    status: StatusCaucao;
    metodoPagamento: MetodoPagamento;
    checkoutUrl: string;
    mpResponse?: any;
    criadoEm: Date;
    atualizadoEm: Date;
};

@Entity('caucao')
export class CaucaoModel extends BaseEntity implements CaucaoModelProps {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => AluguelModel, { nullable: true })
  @JoinColumn({ name: 'aluguelId' })
  aluguel?: AluguelModel;

  @Column({ type: 'varchar', unique: true })
  @Index()
  paymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @Column({
    type: 'enum',
    enum: StatusCaucao,
    default: StatusCaucao.CRIADA,
  })
  @Index()
  status: StatusCaucao;

  @Column({
    type: 'enum',
    enum: MetodoPagamento,
    default: MetodoPagamento.DESCONHECIDO,
  })
  @Index()
  metodoPagamento: MetodoPagamento;

  @Column({ type: 'text'})
  checkoutUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  mpResponse?: any;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;

  static criar(props: Omit<CaucaoModelProps, 'id' | 'criadoEm' | 'atualizadoEm'> & { id?: string }): CaucaoModel {
    const caucao = new CaucaoModel();
    caucao.id = props.id || uuidv4();
    Object.assign(caucao, props);
    return caucao;
  }
}
