import {
    Column,
    Entity,
    Index,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemModel } from './item.model';

@Entity('item_fotos', { schema: 'item' })
@Index('idx_item_fotos_item_id', ['itemId'])
@Index('idx_item_fotos_principal', ['itemId', 'principal'])
@Index('idx_item_fotos_public_id', ['publicIdCloudinary'])
export class FotosItemModel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'public_id_cloudinary',
        type: 'varchar',
        length: 500,
        nullable: false,
    })
    publicIdCloudinary: string;

    @Column({ name: 'item_id', type: 'uuid' })
    itemId: string;

    @ManyToOne(() => ItemModel, (item) => item.fotos, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        nullable: false,
        orphanedRowAction: 'delete',
    })
    @JoinColumn({ name: 'item_id' })
    item: ItemModel;

    @Column({ type: 'text' })
    url: string;

    @Column({ type: 'integer', default: 0 })
    ordem: number;

    @Column({ type: 'boolean', default: false })
    principal: boolean;

    @Column({
        name: 'nome_arquivo',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    nomeArquivo?: string;

    @Column({
        name: 'tamanho_bytes',
        type: 'integer',
        nullable: true,
    })
    tamanhoBytes?: number;

    @CreateDateColumn({ name: 'criado_em', type: 'timestamp' })
    criadoEm: Date;

    static criar(props: Partial<FotosItemModel>): FotosItemModel {
        const foto = new FotosItemModel();
        Object.assign(foto, props);
        return foto;
    }
}
