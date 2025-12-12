// @Entity('item', { schema: 'item' })
// @Index(['idx_item_localizacao]) CREATE INDEX idx_item_localizacao ON item USING GIST (localizacao);
// export class ItemModel {
//     @PrimaryGeneratedColumn('uuid')
//     id: string;

//     @Column({ name: 'usuario_id' })
//     usuarioId: string;

//     @ManyToOne(() => UsuarioModel)
//     @JoinColumn({ name: 'usuario_id' })
//     usuario: UsuarioModel;

//     // Localização EMBEDDED (Value Object)
//     @Column({ name: 'localizacao_lat', type: 'double precision' })
//     localizacaoLat: number;

//     @Column({ name: 'localizacao_lng', type: 'double precision' })
//     localizacaoLng: number;

//     @Column({ name: 'localizacao_cidade', length: 100 })
//     localizacaoCidade: string;

//     @Column({ name: 'localizacao_estado', length: 2 })
//     localizacaoEstado: string;

//     // Campo computado para PostGIS (opcional, mas recomendado)
//     @Index({ spatial: true })
//     @Column({
//         type: 'geography',
//         spatialFeatureType: 'Point',
//         srid: 4326,
//         nullable: true,
//     })
//     localizacao: string; // WKT: POINT(lng lat)
// }

// export class Item {
//   private localizacao: Localizacao; // Value Object

//   constructor(
//     public readonly id: string,
//     public readonly usuarioId: string, // FK para dono
//     // ... outros campos
//     localizacao: Localizacao,
//   ) {
//     this.localizacao = localizacao;
//   }

//   atualizarLocalizacao(novaLocalizacao: Localizacao): void {
//     this.localizacao = novaLocalizacao;
//     // Domain Event: LocalizacaoItemAtualizada
//   }
// }

// await queryRunner.query(`
//   -- Habilitar PostGIS
//   CREATE EXTENSION IF NOT EXISTS postgis;

//   CREATE TABLE item.item (
//     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     usuario_id UUID NOT NULL REFERENCES usuario.usuario(id),
//     nome VARCHAR(255) NOT NULL,

//     -- Localização do item (pode ser diferente do usuário)
//     localizacao_lat DOUBLE PRECISION NOT NULL,
//     localizacao_lng DOUBLE PRECISION NOT NULL,
//     localizacao_cidade VARCHAR(100),
//     localizacao_estado VARCHAR(2),

//     -- Coluna PostGIS para busca espacial eficiente
//     localizacao GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
//       ST_SetSRID(ST_MakePoint(localizacao_lng, localizacao_lat), 4326)
//     ) STORED,

//     criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
//     atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
//   );

//   -- Índice espacial GIST (ESSENCIAL para performance)
//   CREATE INDEX idx_item_localizacao_gist ON item.item USING GIST (localizacao);

//   -- Índice na cidade/estado para filtros adicionais
//   CREATE INDEX idx_item_cidade_estado ON item.item (localizacao_cidade, localizacao_estado);
// `);

// export class BuscarItensProximosUseCase {
//   async execute(dto: {
//     usuarioLat: number;
//     usuarioLng: number;
//     raioKm: number;
//   }): Promise<ItemDto[]> {
//     // Query PostGIS otimizada
//     const itens = await this.itemRepository.query(`
//       SELECT
//         id, nome, localizacao_cidade,
//         ST_Distance(
//           localizacao,
//           ST_SetSRID(ST_MakePoint($1, $2), 4326)
//         ) / 1000 AS distancia_km
//       FROM item.item
//       WHERE ST_DWithin(
//         localizacao,
//         ST_SetSRID(ST_MakePoint($1, $2), 4326),
//         $3 * 1000  -- raio em metros
//       )
//       ORDER BY distancia_km ASC
//       LIMIT 50
//     `, [dto.usuarioLng, dto.usuarioLat, dto.raioKm]);

//     return itens.map(i => this.mapper.toDto(i));
//   }
// }
