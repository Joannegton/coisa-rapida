import { Column } from 'typeorm';

export class EnderecoModel {
    @Column({ name: 'endereco_cep', length: 10 })
    cep: string;

    @Column({ name: 'endereco_rua', length: 255 })
    rua: string;

    @Column({ name: 'endereco_numero', length: 20 })
    numero: string;

    @Column({ name: 'endereco_complemento', length: 255, nullable: true })
    complemento?: string;

    @Column({ name: 'endereco_bairro', length: 100 })
    bairro: string;

    @Column({ name: 'endereco_cidade', length: 100 })
    cidade: string;

    @Column({ name: 'endereco_estado', length: 2 })
    estado: string;

    @Column({ name: 'endereco_pais', length: 100, default: 'Brasil' })
    pais: string;

    @Column({
        name: 'endereco_latitude',
        type: 'double precision',
        nullable: true,
    })
    latitude?: number;

    @Column({
        name: 'endereco_longitude',
        type: 'double precision',
        nullable: true,
    })
    longitude?: number;

    static criar(props: Partial<EnderecoModel>): EnderecoModel {
        const endereco = new EnderecoModel();
        Object.assign(endereco, props);
        return endereco;
    }
}
