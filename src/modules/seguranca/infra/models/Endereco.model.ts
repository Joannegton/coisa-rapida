import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, BaseEntity, OneToOne, JoinColumn } from 'typeorm';
import { UsuarioModel } from './Usuario.model';

export interface EnderecoProps {
  usuarioId: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  latitude?: number;
  longitude?: number;
}

@Entity('endereco')
export class EnderecoModel extends BaseEntity implements EnderecoProps {
  @PrimaryColumn({ name: 'usuario_id' })
  usuarioId: string;

  // Relacionamento inverso
  @OneToOne(() => UsuarioModel, usuario => usuario.endereco)
  @JoinColumn({ name: 'usuario_id', referencedColumnName: 'id' })
  usuario: UsuarioModel;

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

  // Geolocalização
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // Note: For PostGIS geopoint, you might need to install @types/pg and use specific types, but for now, we'll skip or use a string representation
  // @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  // geopoint?: string; // Placeholder, adjust based on PostGIS setup

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  static criar(props: EnderecoProps): EnderecoModel {
    const endereco = new EnderecoModel();
    Object.assign(endereco, props);
    return endereco;
  }
}
