import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dispositivos', { schema: 'notificacoes' })
export class DispositivoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: false })
  usuarioId: string;

  @Column({
    name: 'fcm_token',
    type: 'varchar',
    length: 500,
    unique: true,
    nullable: false,
  })
  fcmToken: string;

  @Column({
    name: 'plataforma',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  plataforma: 'ANDROID' | 'IOS' | 'WEB';

  @Column({ name: 'token_atualizado_em', type: 'timestamp' })
  tokenAtualizadoEm: Date;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo?: {
    modelo?: string;
    versao_so?: string;
    navegador?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
