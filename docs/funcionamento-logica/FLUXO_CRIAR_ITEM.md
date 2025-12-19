# 📦 Fluxo de Criação de Item

> **Última atualização**: 18 de Dezembro de 2025

## 🎯 Visão Geral

Este documento descreve o fluxo completo de criação de um item na plataforma, desde a requisição HTTP até a persistência no banco de dados, incluindo validações, moderação de conteúdo, upload de imagens com verificação de vírus, e processamento assíncrono.

### Tempo de Resposta Esperado

- **Meta**: 1-2 segundos
- **Otimização**: Upload paralelo de imagens + processamento assíncrono de verificação de vírus e moderação

---

## 🔄 Diagrama de Fluxo Simplificado

```
Cliente HTTP
    │
    ├──► POST /item (multipart/form-data)
    │    - Dados do item (JSON)
    │    - Fotos (1-3 arquivos)
    │
    ▼
ItemController (@UseInterceptors FilesInterceptor)
    │
    ├──► Validações Automáticas (class-validator)
    │    - Nome: 5-255 caracteres
    │    - Descrição: 50-2000 caracteres
    │    - Preço: R$ 5 - R$ 10.000
    │    - Categoria, Estado, Tipo válidos
    │
    ├──► Decorators Aplicados
    │    - @AuditarCriacaoItem() → Registra ação na auditoria
    │    - @usuarioAtual() → Extrai userId do JWT
    │
    ▼
CriarItemUseCase
    │
    ├──► 1. Validações de Negócio
    │    ├─ Quantidade de fotos (1-3)
    │    ├─ Usuário verificado?
    │    └─ Endereço completo?
    │
    ├──► 2. Upload de Imagens (Paralelo - Promise.all)
    │    ├─ CloudinaryService.uploadNoCloudinary()
    │    │   ├─ Upload para Cloudinary (~0.5s/imagem)
    │    │   └─ Fire-and-forget: VirusTotal + Fila
    │    │       ├─ Retry 5x (backoff exponencial)
    │    │       └─ Agenda job verificação vírus
    │    │
    │    └─ Cria objetos Foto (domain)
    │        └─ Define primeira foto como principal
    │
    ├──► 3. Criação de Value Objects
    │    ├─ LocalizacaoItem (lat/lng do endereço usuário)
    │    ├─ Preco (por dia/hora + caução)
    │    └─ Disponibilidade (dias/horas min/max)
    │
    ├──► 4. Validação de Conteúdo (ValidadorConteudo)
    │    ├─ Verifica palavras proibidas
    │    ├─ Detecta emails, telefones, links
    │    ├─ Identifica tentativas de contato externo
    │    └─ Define prioridade (baixo/médio/alto)
    │
    ├──► 5. Moderação Inicial (Síncrona)
    │    └─ Se problemas detectados → InvalidPropsException
    │
    ├──► 6. Criação da Entidade Item (domain)
    │    └─ Item.criar() → Retorna Item válido
    │
    ├──► 7. Persistência no Banco
    │    └─ ItemRepository.criar() → Retorna Item salvo com ID
    │
    ├──► 8. Processamento Assíncrono (Fire-and-forget)
    │    ├─ ModeracaoFilaService.agendarVerificacaoAvancada()
    │    │   └─ Fila Bull: verificação avançada de conteúdo
    │    │
    │    └─ EventBus.publish(ItemModeradoEvent)
    │        └─ Notifica sistema sobre moderação
    │
    └──► 9. Resposta HTTP 201 Created
```

---

## 📋 Detalhamento das Etapas

### 1️⃣ **Controller - Ponto de Entrada**

**Arquivo**: `src/modules/item/item.controller.ts`

```typescript
@ApiTags('item')
@Controller('item')
export class ItemController {
    @ApiAccessToken()
    @HttpCode(HttpStatus.CREATED)
    @AuditarCriacaoItem()
    @UseInterceptors(FilesInterceptor('fotos'))
    @Post()
    async criarItem(
        @usuarioAtual() usuario: UsuarioPayload,
        @Body() criarItemDto: CriarItemDto,
        @UploadedFiles() fotos: Express.Multer.File[],
    ): Promise<void> {
        return this.criarItemUseCase.execute({
            ...criarItemDto,
            fotos,
            usuarioId: usuario.sub,
        });
    }
}
```

**Responsabilidades**:

- ✅ Receber requisição multipart/form-data
- ✅ Extrair `usuarioId` do JWT via `@usuarioAtual()`
- ✅ Aplicar validações automáticas (class-validator)
- ✅ Registrar ação de auditoria via `@AuditarCriacaoItem()`
- ✅ Delegar execução para o Use Case

**Decorators Importantes**:

- `@UseInterceptors(FilesInterceptor('fotos'))`: Processa upload de múltiplos arquivos
- `@AuditarCriacaoItem()`: Custom decorator para auditoria
- `@usuarioAtual()`: Extrai payload JWT (sub, email, roles)

---

### 2️⃣ **DTO - Validação de Entrada**

**Arquivo**: `src/modules/item/application/dtos/criar-item.dto.ts`

```typescript
export class CriarItemDto {
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    nome: string;

    @IsString()
    @MinLength(50)
    @MaxLength(2000)
    descricao: string;

    @IsEnum(CategoriaItem)
    categoria: CategoriaItem;

    @IsEnum(EstadoItem)
    estado: EstadoItem;

    @IsNumber()
    @Min(5)
    @Max(10000)
    precoPorDia: number;

    // ... outros campos
}
```

**Validações Automáticas**:

- Nome: 5-255 caracteres
- Descrição: 50-2000 caracteres
- Preço por dia: R$ 5 - R$ 10.000
- Categoria/Estado: Enums válidos
- Dias/horas min/max: Validações de lógica de negócio

---

### 3️⃣ **Use Case - Orquestração do Fluxo**

**Arquivo**: `src/modules/item/application/usecases/criar-item.usecase.ts`

#### 3.1 Validações Iniciais

```typescript
async execute(props: CriarItemUseCaseProps): Promise<void> {
    // Validação 1: Quantidade de fotos
    if (!props.fotos || props.fotos.length <= 0 || props.fotos.length > 3)
        throw new InvalidPropsException('É necessário enviar entre 1 e 3 imagens.');

    // Validação 2: Usuário verificado
    const usuario = await this.usuarioService.buscar(props.usuarioId);
    if (!usuario.verificado) {
        throw new InvalidPropsException('Você não está verificado.');
    }

    // Validação 3: Endereço completo
    if (!usuario.endereco)
        throw new InvalidPropsException('Complete seu endereço.');
}
```

**Por que essas validações?**

- **Fotos**: Garantir experiência visual + limite de storage
- **Usuário verificado**: Reduzir spam e fraudes
- **Endereço**: Necessário para localização geográfica (busca por proximidade)

---

#### 3.2 Upload de Imagens (Paralelo)

**Arquivo**: `src/modules/item/infra/services/upload-imagem.service.ts`

```typescript
private async criarFotosDomain(
    fotos: Express.Multer.File[],
    usuarioId: string,
): Promise<Foto[]> {
    // Upload PARALELO (Promise.all) - Reduz tempo de 3x para 1x
    const uploadFotoResult = await Promise.all(
        fotos.map((foto) =>
            this.uploadService.uploadImagem({ file: foto, usuarioId }),
        ),
    );

    const imagens: Foto[] = [];
    for (const foto of uploadFotoResult) {
        const imagem = Foto.criar({
            id: foto.publicId,
            url: foto.secure_url,
            nomeArquivo: foto.original_filename,
            tamanhoBytes: foto.bytes,
            principal: false,
            ordem: imagens.length + 1,
        });
        imagens.push(imagem);
    }

    // Primeira foto sempre é a principal
    imagens[0].definirComoPrincipal();
    return imagens;
}
```

**Otimização Crítica**: Upload paralelo com `Promise.all()`

- **Antes**: 3 uploads × 0.5s = 1.5s
- **Depois**: max(0.5s) = 0.5s
- **Ganho**: ~66% redução de tempo

---

#### 3.3 Cloudinary + VirusTotal (Fire-and-forget)

**Arquivo**: `src/shared/infra/services/Cloudinary.service.ts`

```typescript
async uploadNoCloudinary(props: {
    usuarioId: string;
    file: Express.Multer.File;
    pasta: string;
    subPasta?: string;
    tipoUpload: TipoUploadCloudinary;
}): Promise<UploadApiResponse> {
    // 1. Upload para Cloudinary (~0.5s)
    const result = await cloudinary.uploader.upload_stream(...);

    // 2. Fire-and-forget: Verificação de vírus (NÃO BLOQUEIA resposta)
    void (async () => {
        const maxAttempts = 5;
        let idAnaliseVirusTotal: string | null = null;

        while (attempt < maxAttempts && !idAnaliseVirusTotal) {
            try {
                // Envio para VirusTotal (retorna ID imediatamente)
                idAnaliseVirusTotal = await this.virusTotalService.enviarArquivo(props.file);

                if (idAnaliseVirusTotal) {
                    // Agenda job na fila Bull/Redis
                    await this.verificacaoVirusFilaService.agendarVerificacao({
                        publicId: result.public_id,
                        idAnaliseVirusTotal,
                        usuarioId: props.usuarioId,
                        tipoUpload: props.tipoUpload,
                    });
                    break;
                }
            } catch (err) {
                // Retry com backoff exponencial: 2s, 4s, 8s, 16s, 32s
                const waitMs = 2000 * Math.pow(2, attempt - 1);
                await sleep(waitMs);
            }
        }

        if (!idAnaliseVirusTotal) {
            this.logger.error('🚨 Não foi possível obter idAnalise após 5 tentativas');
            // TODO: Persistir para reprocessamento
        }
    })();

    // 3. Retorna IMEDIATAMENTE (não aguarda verificação)
    return result;
}
```

**Decisões Arquiteturais**:

- ✅ **Fire-and-forget**: Não bloqueia resposta HTTP
- ✅ **Retry com backoff**: 5 tentativas (2s → 32s)
- ✅ **Garantia de ID**: Só agenda job se obtiver `idAnaliseVirusTotal`
- ✅ **Resiliência**: Logs detalhados + TODO para persistência

**Fluxo do Worker (Background)**:

```
VerificacaoVirusProcessor
    │
    ├──► Consulta status no VirusTotal (GET request leve)
    │    └─ Usa idAnaliseVirusTotal (não reenvia arquivo)
    │
    ├──► Se status = 'completed'
    │    ├─ infectado = false → Log sucesso
    │    └─ infectado = true → Deleta do Cloudinary + Auditoria crítica
    │
    └──► Se status = 'queued'/'pending'
         └─ Lança erro → Bull retry automático (10x, backoff 3s)
```

---

#### 3.4 Validação de Conteúdo

**Arquivo**: `src/shared/utils/validador-conteudo.utils.ts`

```typescript
const validacao = ValidadorConteudo.validar(`${props.nome} ${props.descricao}`);

if (validacao.problemasDetectados.length > 0) {
    throw new InvalidPropsException(
        `Conteúdo inválido: ${validacao.problemasDetectados.join('; ')}`,
    );
}
```

**O que o Validador Verifica?**

- 🚫 Palavras proibidas (drogas, armas, conteúdo adulto, fraude)
- 📧 Emails em contexto de contato
- 📱 Telefones/WhatsApp (tentativa de contato externo)
- 🔗 Links externos (http/https/www)
- 🔢 Sequências numéricas suspeitas (CPF/CNPJ disfarçado)

**Padrões Regex Utilizados**:

```typescript
private static readonly PATTERNS = {
    email: /\b[A-Za-z0-9.%_+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i,
    phone: /(?:\(?\d{2}\)?[-.\s]?)?(?:9\d{4}|\d{4})[-.\s]?\d{4}\b/i,
    numbersSequence: /(?<![\w.]d)\d{11,}(?![\w.])/,
    whatsapp: /(?:whatsapp|zap|whats|wa)[\s:()]*[\+55]*[\s()\-]*(?:\d[\s()\-]*){6,}/i,
    // ... outros patterns
};
```

**Resultado da Validação**:

```typescript
type ValidarResult = {
    temEmail: boolean;
    temTelefone: boolean;
    temLinks: boolean;
    temWhatsapp: boolean;
    temPalavrasProibidas: boolean;
    temSequenciaNumeros: boolean;
    problemasDetectados: string[]; // Lista de problemas encontrados
    prioridade: 'baixo' | 'medio' | 'alto'; // Para priorizar fila
};
```

---

#### 3.5 Criação de Value Objects

```typescript
// Localização (extrai do endereço do usuário)
const localizacao = LocalizacaoItem.criar({
    cep: usuario.endereco.cep,
    cidade: usuario.endereco.cidade,
    estado: usuario.endereco.estado,
    latitude: usuario.endereco.latitude!,
    longitude: usuario.endereco.longitude!,
    endereco: this.formatarEndereco(usuario),
});

// Preços
const precos = Preco.criar({
    precoPorDia: props.precoPorDia,
    valorCaucao: props.valorCaucao,
    precoPorHora: props.precoPorHora,
    caucaoObrigatoria: props.caucaoObrigatoria,
});

// Disponibilidade
const disponibilidade = Disponibilidade.criar({
    diasMaximosAluguel: props.diasMaximosAluguel,
    diasMinimosAluguel: props.diasMinimosAluguel,
    horasMaximosAluguel: props.horasMaximasAluguel,
    horasMinimosAluguel: props.horasMinimasAluguel,
    permitAluguelsConsecutivos: props.permitAluguelsConsecutivos,
});
```

**Por que Value Objects?**

- ✅ Encapsulam lógica de validação
- ✅ Imutáveis (segurança)
- ✅ Reutilizáveis em outros contextos
- ✅ Expressam conceitos do domínio

---

#### 3.6 Criação da Entidade Item

```typescript
const moderacao = Moderacao.criar({
    status: ItemModeracaoStatus.APROVADO,
    contemPalavrasProibidas: validacao.temPalavrasProibidas,
    contemLinksExternos: validacao.temLinks,
    contemTelefone: validacao.temTelefone || validacao.temWhatsapp,
    requerAprovacaoManual: false,
    dataResolucao: new Date(),
});

const itemDomain = Item.criar({
    nome: props.nome,
    descricao: props.descricao,
    categoria: props.categoria,
    estado: props.estado,
    tipoAnuncio: props.tipoAnuncio,
    usuarioId: props.usuarioId,
    fotos: imagens,
    localizacao: localizacao,
    precos: precos,
    disponibilidade: disponibilidade,
    moderacao: moderacao,
});
```

**Padrão Domain-Driven Design (DDD)**:

- `Item.criar()`: Factory method estático
- Validações dentro do próprio domínio
- Garante que Item sempre está em estado válido

---

### 4️⃣ **Persistência - Repository**

**Arquivo**: `src/modules/item/infra/repositories/item.repository.ts`

```typescript
async criar(item: Item): Promise<Item> {
    try {
        const model = this.itemMapper.toModel(item);
        const itemSalvo = await this.repository.save(model);
        return this.itemMapper.toDomain(itemSalvo);
    } catch (error) {
        this.logger.error(`Erro ao criar item: ${error.message}`, error.stack);
        throw new RepositoryException('Erro ao criar item');
    }
}
```

**Padrão Repository**:

- ✅ Abstrai detalhes de persistência
- ✅ Permite trocar banco de dados facilmente
- ✅ Usa Mapper para converter Domain ↔ Model (TypeORM)

**Mapper (Domain → Model)**:

```typescript
toModel(item: Item): ItemModel {
    return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        estado: item.estado,
        // Converte lat/lng para PostGIS Point
        ponto: {
            type: 'Point',
            coordinates: [item.localizacao.longitude, item.localizacao.latitude],
        },
        // ... outros campos
    };
}
```

---

### 5️⃣ **Processamento Assíncrono (Fire-and-forget)**

**Arquivo**: `src/modules/item/application/usecases/criar-item.usecase.ts`

```typescript
// OTIMIZAÇÃO: Fire-and-forget - não aguarda confirmação
Promise.all([
    // 1. Agenda moderação avançada na fila
    this.moderacaoFilaService
        .agendarVerificacaoAvancada({
            descricao: props.descricao,
            itemId: itemSalvo.id,
            nome: props.nome,
            usuarioId: props.usuarioId,
            prioridade: 'alto',
        })
        .catch((error) => {
            console.error('Erro ao agendar moderação (não crítico):', error);
        }),

    // 2. Publica evento de domínio
    Promise.resolve(
        this.eventBus.publish(
            new ItemModeradoEvent(
                itemSalvo.id,
                moderacao.status,
                itemSalvo.criadoEm,
                validacao.problemasDetectados,
            ),
        ),
    ),
]).catch(() => {
    // Ignora erros de processos secundários
});

// Retorna IMEDIATAMENTE após salvar no banco
```

**Por que Fire-and-forget?**

- ✅ Resposta HTTP rápida (1-2s)
- ✅ Moderação avançada pode demorar
- ✅ Não bloqueia experiência do usuário
- ✅ Errors não afetam criação do item

**Fila de Moderação Avançada**:

```typescript
export interface VerificarModeracaoJob {
    itemId: string;
    nome: string;
    descricao: string;
    usuarioId: string;
    prioridade: 'baixo' | 'medio' | 'alto';
}
```

**Worker de Moderação** (Background):

- Revalida conteúdo com mais profundidade
- Pode atualizar status do item (APROVADO → BLOQUEADO)
- Notifica usuário se houver problemas

---

## 🔐 Segurança e Auditoria

### Pontos de Auditoria

1. **Controller**: `@AuditarCriacaoItem()` registra quem/quando/o quê
2. **Upload**: Verificação de vírus assíncrona (VirusTotal)
3. **Conteúdo**: ValidadorConteudo detecta conteúdo proibido
4. **Moderação**: Fila para análise profunda

### Camadas de Validação

```
┌─────────────────────────────────────────┐
│ 1. DTO (class-validator)                │  ← Formato/tipo/tamanho
├─────────────────────────────────────────┤
│ 2. Use Case (validações de negócio)    │  ← Usuário verificado, endereço
├─────────────────────────────────────────┤
│ 3. ValidadorConteudo (conteúdo)        │  ← Palavras proibidas, contato
├─────────────────────────────────────────┤
│ 4. Domain (invariantes)                 │  ← Regras de Item, Foto, Preço
├─────────────────────────────────────────┤
│ 5. Repository (constraints DB)          │  ← Foreign keys, unique, not null
└─────────────────────────────────────────┘
```

---

## ⚡ Otimizações de Performance

### 1. Upload Paralelo de Imagens

```typescript
// ❌ ANTES (Sequencial - ~1.5s para 3 fotos)
for (const foto of fotos) {
    await this.uploadService.uploadImagem({ file: foto, usuarioId });
}

// ✅ DEPOIS (Paralelo - ~0.5s para 3 fotos)
const uploadFotoResult = await Promise.all(
    fotos.map((foto) =>
        this.uploadService.uploadImagem({ file: foto, usuarioId }),
    ),
);
```

### 2. Fire-and-forget para Processos Secundários

```typescript
// ✅ Upload + retorno imediato
const result = await cloudinary.uploader.upload_stream(...);

// ✅ Verificação de vírus em background (não bloqueia)
void (async () => {
    const idAnalise = await virusTotalService.enviarArquivo(file);
    await filaService.agendarVerificacao({ idAnalise, ... });
})();

return result;  // Resposta rápida
```

### 3. Consulta Leve ao VirusTotal

```typescript
// ❌ ANTES: Re-envia arquivo inteiro a cada consulta
const resultado = await virusTotalService.verificarVirus(file); // ~3s

// ✅ DEPOIS: Consulta apenas status com idAnalise
const resultado = await virusTotalService.consultarAnalise(idAnalise); // ~0.2s
```

### 4. Índice Geográfico (PostGIS)

```sql
-- Índice GiST para buscas espaciais otimizadas
CREATE INDEX idx_item_ponto ON item USING GIST (ponto);

-- Busca por proximidade (usa índice)
SELECT * FROM item
WHERE ST_DWithin(
    ponto,
    ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326)::geography,
    5000  -- 5km
);
```

---

## 📊 Métricas de Performance

### Antes das Otimizações

- **Upload 3 fotos**: ~1.5s (sequencial)
- **Verificação vírus síncrona**: ~3s/foto × 3 = ~9s
- **Tempo total**: ~10.5s 🔴

### Depois das Otimizações

- **Upload 3 fotos**: ~0.5s (paralelo)
- **Verificação vírus**: background (não bloqueia)
- **Moderação avançada**: background (não bloqueia)
- **Tempo total**: ~1-2s ✅

**Ganho**: ~80% de redução no tempo de resposta

---

## 🚨 Tratamento de Erros

### Erros Síncronos (Bloqueiam resposta)

```typescript
// Validação DTO inválido → 400 Bad Request
if (!props.fotos || props.fotos.length > 3)
    throw new InvalidPropsException('É necessário enviar entre 1 e 3 imagens.');

// Usuário não verificado → 400 Bad Request
if (!usuario.verificado)
    throw new InvalidPropsException('Você não está verificado.');

// Conteúdo inválido → 400 Bad Request
if (validacao.problemasDetectados.length > 0)
    throw new InvalidPropsException(
        `Conteúdo inválido: ${validacao.problemasDetectados.join('; ')}`,
    );

// Erro de persistência → 500 Internal Server Error
throw new RepositoryException('Erro ao criar item');
```

### Erros Assíncronos (Não bloqueiam resposta)

```typescript
// Falha ao enviar para VirusTotal
void (async () => {
    try {
        const idAnalise = await virusTotalService.enviarArquivo(file);
    } catch (error) {
        this.logger.error('🚨 Erro ao enviar para VT:', error);
        // TODO: Persistir para reprocessamento
    }
})();

// Falha ao agendar moderação
this.moderacaoFilaService.agendarVerificacaoAvancada(...).catch((error) => {
    console.error('Erro ao agendar moderação (não crítico):', error);
});
```

---

## 🔄 Processos Background (Workers)

### 1. Verificação de Vírus (Bull Queue)

**Fila**: `verificacao-virus`  
**Processor**: `VerificacaoVirusProcessor`

```typescript
@Process('verificar-arquivo')
async verificarArquivo(job: Job<VerificacaoVirusJob>): Promise<void> {
    const { publicId, idAnaliseVirusTotal, usuarioId, tipoUpload } = job.data;

    // Consulta status no VirusTotal (leve, não reenvia arquivo)
    const resultado = await this.virusTotalService.consultarAnalise(idAnaliseVirusTotal);

    if (resultado.status === 'completed') {
        if (resultado.infectado) {
            // Deleta do Cloudinary + Auditoria crítica
            await this.cloudinaryService.deletarArquivoCloudinary(publicId);
            await this.auditoriaService.criar({
                acao: AuditoriaAcao.ARQUIVO_INFECTADO_DETECTADO,
                nivel: 'alto',
                // ...
            });
        } else {
            this.logger.log(`✅ Arquivo verificado e aprovado: ${publicId}`);
        }
    } else {
        // Status 'queued'/'pending' → Retry automático
        throw new Error(`Análise ainda em progresso: ${resultado.status}`);
    }
}
```

**Configuração**:

- Priority: 2 (alta)
- Attempts: 10 (consultas leves)
- Backoff: exponencial 3s inicial
- removeOnComplete: true

### 2. Moderação Avançada (Bull Queue)

**Fila**: `verificacao-avancada`  
**Processor**: `ModeracaoAvancadaProcessor`

```typescript
@Process('moderacao')
async processarModeracao(job: Job<VerificarModeracaoJob>): Promise<void> {
    const { itemId, nome, descricao, usuarioId } = job.data;

    // Revalida conteúdo com análise profunda
    const revalidacao = ValidadorConteudo.validar(`${nome} ${descricao}`);

    if (revalidacao.problemasDetectados.length > 0) {
        // Atualiza status do item
        await this.itemRepository.atualizar(itemId, {
            moderacao: {
                status: ItemModeracaoStatus.BLOQUEADO,
                motivo: revalidacao.problemasDetectados.join('; '),
            },
        });

        // Notifica usuário
        await this.notificacaoService.enviar({
            usuarioId,
            tipo: 'ITEM_BLOQUEADO',
            mensagem: 'Seu item foi bloqueado por violar nossas políticas.',
        });
    }
}
```

---

## 📚 Padrões e Princípios Aplicados

### Clean Architecture / Hexagonal

```
Presentation Layer (Controllers)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Entities, Value Objects, Domain Services)
    ↓
Infrastructure Layer (Repositories, External Services)
```

### SOLID

- **S**ingle Responsibility: Cada classe tem uma única responsabilidade
- **O**pen/Closed: Extensível via interfaces (Repository, UploadService)
- **L**iskov Substitution: Implementações respeitam contratos
- **I**nterface Segregation: Interfaces específicas (ItemRepository, UsuarioService)
- **D**ependency Inversion: Depende de abstrações, não de concreções

### CQRS

- **Commands**: CriarItemUseCase (escreve)
- **Events**: ItemModeradoEvent (reage a mudanças)
- **Event Bus**: Desacoplamento entre módulos

### DDD

- **Entities**: Item, Foto
- **Value Objects**: Preco, LocalizacaoItem, Disponibilidade, Moderacao
- **Repositories**: Abstração de persistência
- **Domain Events**: ItemModeradoEvent
- **Factory Methods**: Item.criar(), Foto.criar()

---

## 🔮 Melhorias Futuras

### Alta Prioridade

1. ✅ **Notificação de usuário quando arquivo bloqueado** (email/push)
2. ✅ **Marcar item como suspeito no DB** quando vírus detectado
3. ✅ **Persistir retry de envio ao VT** se falhar permanentemente

### Média Prioridade

4. ⏳ **Métricas Prometheus**: jobs processados, detecções, uploads
5. ⏳ **Testes unitários** para ValidadorConteudo e Workers
6. ⏳ **Cache Redis** para validações de usuário

### Baixa Prioridade

7. 💡 **Compressão de imagens** antes do upload (reduzir bandwidth)
8. 💡 **Webhook VirusTotal** em vez de polling (mais eficiente)
9. 💡 **Machine Learning** para moderação de conteúdo

---

## 🧪 Testando o Fluxo

### Requisição HTTP de Exemplo

```bash
curl -X POST http://localhost:3000/item \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "nome=Furadeira Makita" \
  -F "descricao=Furadeira elétrica em ótimo estado, com maleta e brocas inclusas. Ideal para trabalhos domésticos e profissionais." \
  -F "categoria=FERRAMENTAS" \
  -F "estado=BOM" \
  -F "tipoAnuncio=ALUGUEL" \
  -F "precoPorDia=15.00" \
  -F "valorCaucao=50.00" \
  -F "diasMinimosAluguel=1" \
  -F "diasMaximosAluguel=7" \
  -F "fotos=@imagem1.jpg" \
  -F "fotos=@imagem2.jpg" \
  -F "fotos=@imagem3.jpg"
```

### Resposta Esperada

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "Item criado com sucesso"
}
```

### Logs de Debug

```
[ItemController] POST /item - usuarioId: 123e4567-e89b-12d3-a456-426614174000
[CriarItemUseCase] Validações iniciais OK
[UploadImagemService] Upload paralelo iniciado (3 fotos)
[CloudinaryService] ✅ Upload concluído: coisaRapida/itens/123e4567/imagem1.jpg
[CloudinaryService] 🔁 Tentativa 1 de enviar arquivo ao VirusTotal: imagem1.jpg
[VirusTotalService] ✅ Arquivo enviado ao VT: idAnalise=abc123
[VerificacaoVirusFilaService] ✅ Verificação de vírus agendada (ID: abc123)
[ValidadorConteudo] ✅ Conteúdo validado (0 problemas detectados)
[ItemRepository] ✅ Item salvo com ID: 789xyz
[ModeracaoFilaService] ✅ Verificação avançada agendada (prioridade: alto)
[EventBus] ✅ ItemModeradoEvent publicado
[CriarItemUseCase] ✅ Item criado com sucesso em 1.2s
```

---

## 📖 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [VirusTotal API v3](https://developers.virustotal.com/reference/overview)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [PostGIS Geography Type](https://postgis.net/docs/geography.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

**Documento mantido por**: Time de Engenharia  
**Última revisão**: 18/12/2025  
**Próxima revisão**: 18/03/2026
