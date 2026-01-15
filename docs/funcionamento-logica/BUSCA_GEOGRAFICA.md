# Busca Geográfica de Itens - Regras de Negócio

## Visão Geral

Sistema de busca geográfica para localização de itens disponíveis para aluguel/venda baseado em proximidade. Utiliza PostgreSQL/PostGIS para consultas espaciais otimizadas.

## Tecnologias

- **PostgreSQL 12+** com extensão **PostGIS 3+**
- **TypeORM** para mapeamento objeto-relacional
- **NestJS** para camadas de serviço e controller
- **SRID 4326 (WGS84)**: sistema de coordenadas em graus (lat/lng), distâncias calculadas em metros

---

## Estrutura do Campo Geográfico

### Campo `ponto` (geography point)

- **Tipo**: `geography(Point, 4326)`
- **Geração**: Coluna gerada automaticamente via SQL:
    ```sql
    GENERATED ALWAYS AS (
      ST_SetSRID(ST_MakePoint(localizacao_lng, localizacao_lat), 4326)::geography
    ) STORED
    ```
- **Formato WKT**: `POINT(longitude latitude)` — ordem X Y (lng primeiro)
- **Índice**: GiST espacial (`idx_item_ponto`) para performance otimizada
- **Cálculo de distância**: considera a curvatura da Terra (great circle distance)
- **NÃO DEVE SER SETADO MANUALMENTE** pela aplicação — mantido automaticamente pelo banco

### Vantagens da Coluna Gerada

1. **Consistência garantida**: sempre sincronizado com lat/lng
2. **Performance**: índice GiST otimiza buscas espaciais (ST_DWithin, ST_Distance)
3. **Simplicidade**: sem necessidade de triggers ou hooks no TypeORM
4. **Confiabilidade**: funciona mesmo com updates diretos no banco ou múltiplas aplicações

---

## Endpoints Implementados

### 1. Buscar por Proximidade (Raio)

**Endpoint**: `GET /itens/buscar/proximidade`

**Descrição**: Retorna itens dentro de um raio específico a partir de coordenadas.

**Query Params**:

- `latitude` (obrigatório): -90 a 90
- `longitude` (obrigatório): -180 a 180
- `raioMetros` (opcional, padrão: 5000): 100 a 100000 metros
- `categorias` (opcional): array de CategoriaItem
- `precoMaximoPorDia` (opcional): filtro de preço máximo
- `estadoMinimo` (opcional): estado mínimo aceitável do item
- `ordenarPor` (opcional, padrão: `distancia`): `distancia`, `preco`, `popularidade`
- `limite` (opcional, padrão: 20): 1 a 100
- `offset` (opcional, padrão: 0): paginação

**Exemplo**:

```
GET /itens/buscar/proximidade?latitude=-23.5505&longitude=-46.6333&raioMetros=5000&categorias=ELETRONICOS&ordenarPor=preco&limite=20
```

**Resposta**:

```json
[
    {
        "item": {
            /* dados do item */
        },
        "distanciaMetros": 1234.56,
        "distanciaFormatada": "1.2 km"
    }
]
```

**Regras**:

- Apenas itens com `status = ATIVO`
- Distância em linha reta (great circle)
- Ordenação por distância (padrão), preço ou popularidade (alugueis_totais)
- Filtros opcionais aplicados via SQL WHERE

---

### 2. Buscar Mais Próximos (Sem Limite de Raio)

**Endpoint**: `GET /itens/buscar/mais-proximos`

**Descrição**: Retorna os N itens mais próximos de um ponto, sem limitação de raio.

**Query Params**:

- `latitude` (obrigatório)
- `longitude` (obrigatório)
- `limite` (opcional, padrão: 10): 1 a 50
- `offset` (opcional, padrão: 0)

**Exemplo**:

```
GET /itens/buscar/mais-proximos?latitude=-23.5505&longitude=-46.6333&limite=10
```

**Uso**:

- Feature "Itens perto de você"
- Recomendações por proximidade

**Regras**:

- Apenas itens ATIVO
- Ordenação sempre por distância crescente

---

### 3. Calcular Distância para Item Específico

**Endpoint**: `GET /itens/:itemId/distancia`

**Descrição**: Calcula distância entre um item específico e coordenadas fornecidas.

**Params**:

- `itemId` (path): UUID do item

**Query Params**:

- `latitude` (obrigatório)
- `longitude` (obrigatório)

**Exemplo**:

```
GET /itens/123e4567-e89b-12d3-a456-426614174000/distancia?latitude=-23.5505&longitude=-46.6333
```

**Resposta**:

```json
{
    "distanciaMetros": 2345.67,
    "distanciaFormatada": "2.3 km"
}
```

**Regras**:

- Retorna 404 se item não existir
- Calcula distância independentemente do status do item

---

### 4. Estatísticas de Proximidade

**Endpoint**: `GET /itens/estatisticas/proximidade`

**Descrição**: Retorna contagem de itens em diferentes raios (1km, 5km, 10km, 50km).

**Query Params**:

- `latitude` (obrigatório)
- `longitude` (obrigatório)

**Exemplo**:

```
GET /itens/estatisticas/proximidade?latitude=-23.5505&longitude=-46.6333
```

**Resposta**:

```json
[
    { "raioMetros": 1000, "quantidadeItens": 5 },
    { "raioMetros": 5000, "quantidadeItens": 42 },
    { "raioMetros": 10000, "quantidadeItens": 158 },
    { "raioMetros": 50000, "quantidadeItens": 1024 }
]
```

**Uso**:

- Analytics de cobertura geográfica
- Dashboards administrativos
- Indicadores de disponibilidade por região

---

## Funções PostGIS Utilizadas

### ST_DWithin (Busca por Raio)

```sql
ST_DWithin(
  item.ponto,
  ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
  :raioMetros
)
```

- **Performance**: usa índice GiST automaticamente
- **Retorna**: `true` se ponto está dentro do raio
- **Eficiência**: O(log n) com índice vs O(n) sem índice

### ST_Distance (Cálculo de Distância)

```sql
ST_Distance(
  item.ponto,
  ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
)
```

- **Retorna**: distância em metros (com geography)
- **Precisão**: considera curvatura da Terra (great circle)
- **Uso**: ordenação por proximidade, cálculo exato de distância

### ST_MakePoint + ST_SetSRID

```sql
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
```

- **ST_MakePoint**: cria geometry point a partir de coordenadas (ordem: lng, lat)
- **ST_SetSRID**: define sistema de referência (4326 = WGS84)
- **Cast para geography**: garante cálculos em metros

---

## Regras de Validação

### Coordenadas

- **Latitude**: -90 a 90 (class-validator `@Min/@Max`)
- **Longitude**: -180 a 180
- **Constraint no banco**: `CHECK (localizacao_lat BETWEEN -90 AND 90)`

### Raio de Busca

- **Mínimo**: 100 metros (evita buscas muito restritas)
- **Máximo**: 100.000 metros (100 km, limita carga do servidor)
- **Padrão**: 5.000 metros (5 km, raio urbano típico)

### Paginação

- **Limite máximo por proximidade**: 100 resultados
- **Limite máximo "mais próximos"**: 50 resultados
- **Offset**: sem limite (permite paginação infinita)

### Filtros de Estado (Hierarquia de Qualidade)

Ordem: `NOVO > COMO_NOVO > BOM > REGULAR > PARA_CONSERTAR`

Exemplo: `estadoMinimo=BOM` retorna apenas `[NOVO, COMO_NOVO, BOM]`

---

## Formatação de Distância

**Regra**:

- `< 1000m`: exibe em metros (ex: `"345 m"`)
- `>= 1000m`: exibe em km com 1 casa decimal (ex: `"2.5 km"`)

**Implementação**:

```typescript
private formatarDistancia(metros: number): string {
  if (metros < 1000) {
    return `${Math.round(metros)} m`;
  }
  return `${(metros / 1000).toFixed(1)} km`;
}
```

---

## Ordenação

### Por Distância (padrão)

```sql
ORDER BY distancia_metros ASC
```

### Por Preço

```sql
ORDER BY item.precoPorDia ASC, distancia_metros ASC
```

- Ordena por preço crescente, desempate por proximidade

### Por Popularidade

```sql
ORDER BY item.aluguelsTotais DESC, distancia_metros ASC
```

- Itens mais alugados primeiro, desempate por proximidade

---

## Performance e Otimização

### Índices Criados

1. **Índice GiST espacial** (CRÍTICO):

    ```sql
    CREATE INDEX idx_item_ponto ON item.item USING GIST(ponto);
    ```

    - Acelera ST_DWithin e ST_Distance
    - Performance: O(log n) para buscas espaciais

2. **Índices compostos** (filtros adicionais):
    ```sql
    idx_item_usuario_status (usuario_id, status)
    idx_item_categoria_status (categoria, status)
    ```

    - Otimiza filtros combinados com busca espacial

### Dicas de Performance

1. **Sempre use ST_DWithin para buscas por raio** (não ST_Distance < X)
    - ST_DWithin usa índice GIST eficientemente
    - ST_Distance força scan completo se usado sozinho em WHERE

2. **Limite resultados** (use `LIMIT` adequadamente)
    - Evita retornar milhares de linhas
    - Implementa paginação

3. **Filtros antes da ordenação**
    - WHERE status = 'ATIVO' reduz dataset antes de calcular distâncias
    - Categoria e preço também filtram antes de computar distâncias

4. **Vacuum e Analyze**
    - Execute periodicamente para manter estatísticas do índice GiST atualizadas
    ```sql
    VACUUM ANALYZE item.item;
    ```

---

## Testes Sugeridos

### 1. Busca Básica

```bash
curl "http://localhost:3000/itens/buscar/proximidade?latitude=-23.5505&longitude=-46.6333&raioMetros=5000"
```

### 2. Busca com Filtros

```bash
curl "http://localhost:3000/itens/buscar/proximidade?latitude=-23.5505&longitude=-46.6333&raioMetros=10000&categorias=ELETRONICOS&categorias=FERRAMENTAS&precoMaximoPorDia=50&ordenarPor=preco"
```

### 3. Validação de Índice (SQL direto)

```sql
EXPLAIN ANALYZE
SELECT *
FROM item.item
WHERE ST_DWithin(
  ponto,
  ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography,
  5000
)
AND status = 'ATIVO';
```

- Deve mostrar "Index Scan using idx_item_ponto" (não Seq Scan)

---

## Futuras Melhorias

1. **Cache de resultados frequentes** (Redis com coordenadas como chave)
2. **Clustering geográfico** (agrupar itens próximos em mapas)
3. **Filtro por polígono/região** (bairros, cidades via ST_Within)
4. **Notificações por proximidade** (push quando item novo aparece próximo)
5. **Heatmap de disponibilidade** (agregação espacial para visualização)
6. **Suporte a rotas** (usar pgRouting para distância real via vias)

---

## Referências

- [PostGIS Documentation](https://postgis.net/docs/)
- [PostgreSQL Geography Type](https://postgis.net/docs/using_postgis_dbmanagement.html#PostGIS_Geography)
- [ST_DWithin Reference](https://postgis.net/docs/ST_DWithin.html)
- [ST_Distance Reference](https://postgis.net/docs/ST_Distance.html)
- [SRID 4326 (WGS84)](https://epsg.io/4326)
