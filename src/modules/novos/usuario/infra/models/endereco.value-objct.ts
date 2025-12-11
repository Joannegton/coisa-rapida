import { Column } from 'typeorm';

export class EnderecoModel {
  @Column({ length: 10 })
  cep: string;

  @Column({ length: 255 })
  rua: string;

  @Column({ length: 20 })
  numero: string;

  @Column({ length: 255, nullable: true })
  complemento?: string;

  @Column({ length: 100 })
  bairro: string;

  @Column({ length: 100 })
  cidade: string;

  @Column({ length: 2 })
  estado: string;

  @Column({ length: 100, default: 'Brasil' })
  pais: string;

  @Column({ type: 'double precision', nullable: true })
  latitude?: number;

  @Column({ type: 'double precision', nullable: true })
  longitude?: number;
}
