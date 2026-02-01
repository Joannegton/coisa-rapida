import { Column } from 'typeorm';

export class LocalizacaoItemModel {
    @Column({ name: 'localizacao_lat', type: 'double precision' })
    latitude: number;

    @Column({ name: 'localizacao_lng', type: 'double precision' })
    longitude: number;

    @Column({ name: 'localizacao_endereco', type: 'varchar', length: 500 })
    endereco: string;

    @Column({ name: 'localizacao_cidade', length: 100 })
    cidade: string;

    @Column({ name: 'localizacao_estado', length: 2 })
    estado: string;

    @Column({ name: 'localizacao_cep', length: 10 })
    cep: string;

    @Column({ name: 'localizacao_bairro', length: 100 })
    bairro: string;

    /**
     * Campo geography(Point, 4326) gerado automaticamente pelo PostgreSQL/PostGIS.
     * Calculado a partir de localizacao_lng e localizacao_lat via GENERATED ALWAYS AS.
     * Usado para consultas espaciais otimizadas com índice GiST (ST_DWithin, ST_Distance).
     *
     * Formato interno: WKT POINT(longitude latitude) - ordem X Y
     * SRID 4326 = WGS84 (coordenadas em graus, distâncias em metros)
     *
     * NÃO SETAR MANUALMENTE - este campo é mantido automaticamente pelo banco.
     */
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
        insert: false,
        update: false,
    })
    ponto?: string;

    static criar(props: Partial<LocalizacaoItemModel>): LocalizacaoItemModel {
        const localizacao = new LocalizacaoItemModel();
        Object.assign(localizacao, props);
        return localizacao;
    }
}
