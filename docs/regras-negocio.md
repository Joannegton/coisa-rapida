# **Documento de Regras de Negócio - Coisa Rápida**

---

## Índice de Navegação Rápida

- [Visão Geral](#visão-geral)

### 👤 Usuários

- **[1. Cadastro e Autenticação](#1-cadastro-e-autenticação)**
    - [1.1 Verificação de Identidade](#11-processo-de-verificação-de-identidade)
        - [Verificação de Telefone (SMS)](#verificação-de-telefone-sms)
        - [Verificação de Residência](#verificação-de-residência-comprovante)
        - [Verificação de Identidade (Documento)](#verificação-de-identidade-documento-com-foto)
- **[2. Sistema de Avaliação e Reputação](#2-sistema-de-avaliação-e-reputação)**

### 🏠 Aluguéis (Core Business)

- **[3. Aluguéis - Gestão do Ciclo de Vida](#3-aluguéis---gestão-do-ciclo-de-vida)** ⭐
    - [3.1 Máquina de Estados](#31-máquina-de-estados-do-aluguel)
    - [3.1.1 Cenários de Fluxo](#311-cenários-de-fluxo)
    - [3.2 Criação e Aprovação](#32-criação-e-aprovação)
    - [3.3 Sistema de Caução (Escrow)](#33-sistema-de-caução-escrow) 💰
    - [3.4.1 Validações de Transição](#341-validações-de-transição-de-estados)
    - [3.5 Período de Aluguel](#35-período-de-aluguel)
    - [3.6 Devolução e Finalização](#36-devolução-e-finalização)

### 💳 Financeiro

- **[4. Pagamentos e Finanças](#4-pagamentos-e-finanças)**
    - [4.1 Integração Mercado Pago](#41-integração-mercado-pago)
    - [4.2 Cálculos Financeiros](#42-cálculos-financeiros)
    - [4.3 Tabela de Transferências](#43-tabela-de-transferências-auditoria)

### ⚖️ Gestão e Suporte

- **[5. Disputas e Resoluções](#5-disputas-e-resoluções)**
- **[6. Segurança e Verificação](#6-segurança-e-verificação)**
- **[7. Comunicação e Notificações](#7-comunicação-e-notificações)**

### 📦 Produtos e Anúncios

- **[8. Anúncios e Itens](#8-anúncios-e-itens)**

### 📋 Conformidade e Política

- **[9. Conformidade e Política](#9-conformidade-e-política)**

### 🔧 Técnico

- **[10. Eventos de Domínio e Integrações](#10-eventos-de-domínio-e-integrações)**
- **[11. Considerações Técnicas para Devs](#11-considerações-técnicas-para-o-time-de-dev)**

### 📈 Planejamento

- **[12. Roadmap de Melhorias Futuras](#12-roadmap-de-melhorias-futuras)**
- **[13. KPIs e Métricas de Sucesso](#13-kpis-e-métricas-de-sucesso)**

### 🎲 Edge Cases e Suporte

- **[14. Edge Cases e Cenários Especiais](#14-edge-cases-e-cenários-especiais)**
- **[15. Suporte ao Usuário](#15-suporte-ao-usuário)**
- **[16. Glossário de Termos](#16-glossário-de-termos)**

---

## Visão Geral

O Coisa Rápida é uma plataforma de compartilhamento e aluguel peer-to-peer que conecta proprietários de itens com pessoas que desejam alugá-los por períodos determinados. As regras de negócio descritas abaixo garantem segurança, confiança e transparência para todos os usuários.

**Stack Tecnológica:**

- Backend: NestJS + PostgreSQL + TypeORM (DDD Architecture)
- Frontend: Flutter + Riverpod + Firebase
- Pagamentos: Mercado Pago
- Storage: Firebase Storage para imagens/documentos
- Real-time: Firestore para chat e notificações ao vivo

---

## **1. Cadastro e Autenticação**

| Check | Regra                                | Descrição                                                                                                    | Prioridade |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------- |
| [ ]   | **Idade Mínima**                     | O usuário deve ter 18 anos ou mais para se cadastrar e utilizar a plataforma.                                | Alta       |
| [x]   | **Senha Forte**                      | Mínimo 8 caracteres com pelo menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.                | Alta       |
| [x]   | **Validação de E-mail**              | E-mail único na plataforma. Confirmação obrigatória via link enviado. Prazo de 3h para ativação.             | Alta       |
| [x]   | **Validação de Telefone**            | Telefone único por usuário, confirmado via SMS com código de 6 dígitos válido por 10 minutos.                | Alta       |
| [x]   | **Comprovante de Endereço**          | Documento oficial (conta de serviço, contrato) em nome do usuário com endereço legível. Válido por 12 meses. | Alta       |
| [ ]   | **Verificação de Identidade**        | Documento de identidade (RG, CNH ou Passaporte) com foto legível e válida.                                   | Média      |
| [x]   | **Bloqueio por Tentativas de Login** | Após 5 tentativas falhadas, conta bloqueada por 30 minutos. Notificação enviada por e-mail.                  | Alta       |
| [ ]   | **Bloqueio por Suspeita de Fraude**  | Sistema monitora padrões anormais. Bloqueio preventivo com verificação adicional antes de desbloqueio.       | Alta       |
| [x]   | **Transações Restritas**             | Apenas usuários com todas as validações completas podem fazer transações (falta validação de identidade).    | Alta       |
| [ ]   | **Exclusão de Conta**                | Dados mantidos por 30 dias após exclusão (conformidade LGPD). Permanentemente excluídos após esse período.   | Média      |
| [ ]   | **Reativação de Conta**              | Usuários podem reativar conta deletada em até 7 dias. Após isso, é necessário novo cadastro.                 | Baixa      |
| [ ]   | **Status da Conta**                  | Conta pode estar: `ativa`, `bloqueada_temporaria`, `suspensa`, `excluida_soft`, `banida_permanente`.         | Alta       |
| [ ]   | **Verificações Necessárias**         | Para ANUNCIAR itens: Email + Telefone + Endereço verificados. Para ALUGAR: apenas Email + Telefone.          | Alta       |

---

## **1.1 Processo de Verificação de Identidade**

### **Verificação de Telefone (SMS)**

| Check | Regra              | Descrição                                                                                | Prioridade |
| ----- | ------------------ | ---------------------------------------------------------------------------------------- | ---------- |
| [x]   | **Código SMS**     | Código de 6 dígitos enviado via serviço de SMS (ex: Twilio). Válido por 10 minutos.      | Alta       |
| [x]   | **Tentativas**     | Máximo 3 tentativas de código incorreto. Após isso, aguardar 15 minutos para novo envio. | Alta       |
| [ ]   | **Unicidade**      | Um telefone só pode ser vinculado a uma conta ativa.                                     | Alta       |
| [ ]   | **Re-verificação** | Necessária a cada 12 meses ou se o telefone for alterado.                                | Média      |

### **Verificação de Residência (Comprovante)**

| Check | Regra                     | Descrição                                                                                                     | Prioridade |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Alteração de endereço** | Se alterar o endereço, precisa alterar o endereço de todos os produtos desse usuario                          | Alta       |
| [x]   | **Documentos Aceitos**    | Conta de luz/água/gás, contrato de aluguel, extrato bancário, boleto de IPTU. Máx 90 dias de emissão.         | Alta       |
| [ ]   | **Validação Manual**      | Moderador analisa em até 48h úteis. Verifica nome do usuário, endereço legível e data do documento.           | Alta       |
| [ ]   | **Status de Moderação**   | `pendente`, `em_analise`, `aprovado`, `rejeitado`, `cancelado`.                                               | Alta       |
| [ ]   | **Motivos de Rejeição**   | Documento ilegível, documento vencido, nome não corresponde, endereço incompleto, documento adulterado.       | Alta       |
| [ ]   | **Reenvio**               | Se rejeitado, usuário pode reenviar novo documento. Máximo 3 tentativas. Após isso, análise por especialista. | Média      |
| [ ]   | **Validade**              | Comprovante válido por 12 meses. Sistema notifica 15 dias antes do vencimento.                                | Alta       |

### **Verificação de Identidade (Documento com Foto)**

| Check | Regra                    | Descrição                                                                                     | Prioridade |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Documentos Aceitos**   | RG, CNH, Passaporte, RNE (Registro Nacional de Estrangeiros).                                 | Alta       |
| [ ]   | **Validação**            | OCR + análise manual. Sistema extrai nome e CPF do documento e compara com dados cadastrados. | Média      |
| [ ]   | **Selfie com Documento** | Opcional (futuro): Usuário tira selfie segurando documento para validação biométrica.         | Baixa      |
| [ ]   | **Status**               | Armazenado junto com `verificacoes_residencia` ou em tabela separada se necessário.           | Média      |

---

## **2. Sistema de Avaliação e Reputação**

| Check | Regra                            | Descrição                                                                                                          | Prioridade |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- |
| [ ]   | **Avaliação Obrigatória**        | Ambas as partes devem avaliar a transação em até 7 dias após conclusão.                                            | Alta       |
| [ ]   | **Escala de Classificação**      | Avaliação em estrelas (1-5) com comentário opcional. Comentários ofensivos são removidos automaticamente.          | Alta       |
| [ ]   | **Bloqueio por Baixa Reputação** | Usuários com média abaixo de 3.0 estrelas têm funcionalidades limitadas (anuncia itens, mas com aprovação manual). | Média      |
| [ ]   | **Histórico Público**            | Últimas 10 transações com avaliações são visíveis no perfil. Avaliações com mais de 2 anos são arquivadas.         | Média      |
| [ ]   | **Resposta a Avaliações**        | Usuários podem responder a avaliações dentro de 30 dias.                                                           | Baixa      |

---

## **3. Aluguéis - Gestão do Ciclo de Vida**

### **Resumo Executivo**

O sistema de aluguéis utiliza uma **máquina de estados rigorosa** com 8 estados principais e controle de caução separado:

- **8 Estados do Aluguel**: `PAGAMENTO_PENDENTE`, `SOLICITADO`, `CONFIRMADO`, `ATIVO`, `DEVOLVIDO`, `CONCLUIDO`, `CANCELADO`, `DISPUTADO`
- **6 Estados da Caução**: `AGUARDANDO_PAGAMENTO`, `PAGA`, `PROCESSANDO`, `DEVOLVIDA`, `CANCELADA`
- **Validações automáticas** em cada transição de estado
- **Timeouts configurados**: 30min (pagamento), 24h (aprovação locador), 48h (devolução)
- **Suporte a disputas** com sistema de mediação e indenização

**Conceito Chave - Sistema de Caução:**

- Locatário paga **APENAS a caução**
- A caução deve ser **maior que o valor do aluguel + taxa**
- Na devolução, o **aluguel + taxa** são **descontados da caução**
- Locatário recebe de volta: `caução - aluguel - taxa - indenização(se houver)`
- Se houver danos, indenização também é descontada da caução

### **3.1 Máquina de Estados do Aluguel**

O sistema de aluguel segue uma máquina de estados rigorosa. Cada transição de estado possui validações específicas.

**Estados Possíveis (enum `AluguelStatus`):**

- `PAGAMENTO_PENDENTE`: Aluguel criado, aguardando pagamento inicial
- `SOLICITADO`: Aluguel solicitado, aguardando aprovação do locador
- `CONFIRMADO`: Aluguel aprovado pelo locador, aguardando início
- `ATIVO`: Aluguel em andamento, item em posse do locatário
- `DEVOLVIDO`: Item devolvido, aguardando confirmação final
- `CONCLUIDO`: Aluguel finalizado com sucesso
- `CANCELADO`: Aluguel cancelado
- `DISPUTADO`: Aluguel em disputa entre as partes

**Estados da Caução (enum `StatusCaucao`):**

- `AGUARDANDO_PAGAMENTO`: Aguardando confirmação de pagamento
- `PAGA`: Caução paga e confirmada
- `PROCESSANDO`: Pagamento em processamento
- `DEVOLVIDA`: Caução devolvida ao locatário
- `CANCELADA`: Caução cancelada

### **3.1.1 Cenários de Fluxo**

#### **Fluxo Completo com Caução (Happy Path)**

1. **Criação**: Locatário solicita → Status: `PAGAMENTO_PENDENTE`
2. **Pagamento**: Locatário paga a caução (ex: R$200) → Caução: `PAGA` / Aluguel: `SOLICITADO`
3. **Aprovação**: Locador aprova em 24h → Status: `CONFIRMADO`
4. **Início**: Data de início alcançada → Status: `ATIVO`
5. **Devolução**: Locatário devolve → Status: `DEVOLVIDO`
6. **Conclusão**: Locador confirma sem danos → Sistema desconta aluguel (R$100) + taxa (R$10) da caução → Locatário recebe R$90 de volta → Status: `CONCLUIDO` / Caução: `DEVOLVIDA`

#### **Fluxo com Disputa por Danos**

1. Estados 1-5 iguais ao fluxo acima
2. **Disputa**: Locador reporta danos (ex: R$50) → Status: `DISPUTADO`
3. **Resolução**: Sistema processa → Desconta aluguel (R$100) + taxa (R$10) + indenização (R$50) da caução (R$200) → Locatário recebe R$40 de volta → Locador recebe R$90 (aluguel) + R$50 (indenização) = R$140 → Status: `CONCLUIDO`

#### **Fluxo de Cancelamento**

- **Antes de SOLICITADO (sem pagamento)**: Cancelamento gratuito → Status: `CANCELADO`
- **Em PAGAMENTO_PENDENTE ou SOLICITADO**: Reembolso total da caução (100%) → Status: `CANCELADO` / Caução: `CANCELADA`
- **Em SOLICITADO (locador recusa)**: Timeout 24h ou recusa → Reembolso total → Status: `CANCELADO`
- **Após CONFIRMADO**: Multa de 10% do aluguel retida da caução se cancelar < 48h antes do início → Restante reembolsado → Status: `CANCELADO`

### **3.2 Criação e Aprovação**

| Check | Regra                            | Descrição                                                                                                                                 | Prioridade |
| ----- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Fluxo de Solicitação**         | Locatário solicita aluguel especificando datas de início/fim. Sistema calcula automaticamente: dias, valor total, taxa plataforma.        | Alta       |
| [ ]   | **Validação de Disponibilidade** | verificação se item está disponível nas datas solicitadas.                                                                                | Alta       |
| [ ]   | **Aprovação Automática**         | Se locador configurou `aprovacaoAutomatica=true` no item, aluguel é aprovado instantaneamente. Caso contrário, requer aprovação manual.   | Alta       |
| [ ]   | **Janela de Resposta**           | Locador tem 24h para aprovar/recusar. Após isso, solicitação expira automaticamente.                                                      | Alta       |
| [ ]   | **Aprovação Condicional**        | **[FUTURO]** Locador pode aprovar com condições (ex: adiantamento, caução extra). Locatário tem 12h para aceitar.                         | Média      |
| [ ]   | **Cancelamento pelo Locatário**  | Antes de `CONFIRMADO`: cancelamento gratuito. Após `CONFIRMADO`: multa de 10% do valor se < 48h antes da data início.                     | Alta       |
| [ ]   | **Recusa pelo Locador**          | Obrigatório fornecer motivo. Opções: `indisponivel`, `perfil_inadequado`, `problema_datas`, `outro`. Armazenado em `motivoRecusaLocador`. | Alta       |
| [ ]   | **Criação de Contrato**          | Ao aprovar, sistema gera contrato digital com termos, valores, datas e assinaturas digitais. Armazenado em tabela `contratos`.            | Alta       |

### **3.3 Sistema de Caução (Escrow)**

O sistema de caução é o coração financeiro da plataforma. A caução funciona como **garantia + pagamento**: o locatário paga apenas a caução, e na devolução, o valor do aluguel + taxa é descontado, devolvendo o restante. Existem **2 cenários principais**:

#### **Entendendo a Lógica da Caução**

**Por que apenas a caução?**

- Simplifica o fluxo de pagamento (um único pagamento)
- A caução serve como garantia E como fonte de pagamento
- Locatário só precisa de 1 transação, não 2 (caução + aluguel)
- Valor da caução deve sempre ser maior que o custo do aluguel

**Como funciona na prática?**

1. **Locador define**: "Item custa R$ 100/dia, caução R$ 200"
2. **Locatário paga**: Apenas R$ 200 (via Mercado Pago)
3. **Valor fica retido**: R$ 200 em escrow durante o aluguel
4. **Na devolução sem danos**:
    - Sistema desconta: R$ 100 (aluguel) + R$ 10 (taxa) = R$ 110
    - Locatário recebe de volta: R$ 90
    - Locador recebe: R$ 90 (o aluguel menos a taxa)
5. **Na devolução com danos (ex: R$ 50)**:
    - Sistema desconta: R$ 100 + R$ 10 + R$ 50 = R$ 160
    - Locatário recebe de volta: R$ 40
    - Locador recebe: R$ 140 (aluguel + indenização, menos taxa)

#### **Cenário 1: COM CAUÇÃO (Recomendado para itens de alto valor)**

**Conceito**: A caução funciona como **garantia e pagamento combinados**. O locatário paga apenas a caução (que deve ser maior que o valor do aluguel). Na devolução, o valor do aluguel + taxa é descontado da caução, e o restante é devolvido.

| Etapa                        | Descrição                                                                                                                    | Sistema     | Valores e Status                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| **1. Criação**               | Locatário solicita aluguel. Sistema calcula caução mínima: `caucao ≥ valorAluguel + taxaApp`                                 | Backend     | Exemplo: Aluguel R$100 + Taxa R$10 = Caução mínima R$110       |
| **2. Pagamento Caução**      | Locatário paga APENAS a caução (ex: R$200) via Mercado Pago. Valor fica retido (escrow).                                     | MP Checkout | Aluguel: `PAGAMENTO_PENDENTE` / Caução: `AGUARDANDO_PAGAMENTO` |
| **3. Confirmação Pagamento** | Webhook confirma pagamento da caução. Aluguel aguarda aprovação do locador.                                                  | Webhook     | Aluguel: `SOLICITADO` / Caução: `PAGA`                         |
| **4. Aprovação Locador**     | Locador aprova a solicitação em até 24h.                                                                                     | Backend     | Aluguel: `CONFIRMADO`                                          |
| **5. Início do Aluguel**     | Na data de início, aluguel se torna ativo (automático ou manual).                                                            | Backend     | Aluguel: `ATIVO`                                               |
| **6. Devolução**             | Locatário marca item como devolvido.                                                                                         | Backend     | Aluguel: `DEVOLVIDO`                                           |
| **7. Finalização SEM DANO**  | Locador confirma. Sistema desconta: Taxa app R$10 (retida), Locador recebe R$90, Locatário recebe R$100 (R$200 - R$100).     | Backend     | Aluguel: `CONCLUIDO` / Caução: `DEVOLVIDA` (parcialmente)      |
| **8. Finalização COM DANO**  | Locador reporta dano R$50. Sistema calcula: Taxa R$10 (retida), Locador R$140 (R$90 + R$50), Locatário R$50 (R$200 - R$150). | Backend     | Aluguel: `DISPUTADO` → `CONCLUIDO` / Indenização da caução     |

**Fórmulas de Cálculo:**

```typescript
caucaoMinima = valorAluguel + valorAluguel * taxaAppPercentual;
taxaApp = valorAluguel * taxaAppPercentual; // 10%
valorLiquidoLocador = valorAluguel - taxaApp;

// Sem danos
retornoLocatario = caucao - valorAluguel - taxaApp; // Caução menos custos do aluguel
transferenciaLocador = valorLiquidoLocador;

// Com danos
indenizacao = definidaPeloLocadorOuPadrao; // Máximo: caucao - valorAluguel - taxaApp
retornoLocatario = caucao - valorAluguel - taxaApp - indenizacao;
transferenciaLocador = valorLiquidoLocador + indenizacao;
```

**Distribuição de Valores (MVP - Conta PF):**

Na finalização do aluguel, a caução é distribuída da seguinte forma:

- **Taxa da Plataforma (10%)**: Retida automaticamente na conta Mercado Pago do admin
- **Pagamento ao Locador**: Valor do aluguel menos a taxa (manual via Pix)
    - Sistema gera instruções com chave Pix do locador
    - Admin realiza transferência manualmente
- **Devolução ao Locatário**: Caução menos (aluguel + taxa + indenização se houver)
    - Automático via Mercado Pago Refund API
    - Processado imediatamente após confirmação da devolução

**Exemplo Prático (SEM DANOS):**

- Caução paga: R$ 200,00
- Valor aluguel: R$ 100,00
- Taxa plataforma (10%): R$ 10,00
- **Locador recebe**: R$ 90,00 (via Pix manual)
- **Locatário recebe de volta**: R$ 100,00 (via Refund API)
- **Plataforma retém**: R$ 10,00

**Exemplo Prático (COM DANOS - Indenização R$ 50,00):**

- Caução paga: R$ 200,00
- Valor aluguel: R$ 100,00
- Taxa plataforma (10%): R$ 10,00
- Indenização: R$ 50,00
- **Locador recebe**: R$ 140,00 (R$ 90,00 aluguel + R$ 50,00 indenização via Pix manual)
- **Locatário recebe de volta**: R$ 50,00 (via Refund API)
- **Plataforma retém**: R$ 10,00

#### **Cenário 2: SEM CAUÇÃO (Para itens de baixo valor)**

| Etapa              | Descrição                                                                            | Sistema     | Status                                  |
| ------------------ | ------------------------------------------------------------------------------------ | ----------- | --------------------------------------- |
| **1. Criação**     | Locatário solicita aluguel sem caução. Pagamento direto do valor do aluguel.         | Backend     | `PAGAMENTO_PENDENTE`                    |
| **2. Pagamento**   | Locatário paga valor do aluguel via Mercado Pago.                                    | MP Checkout | `SOLICITADO`                            |
| **3. Aprovação**   | Locador aprova solicitação.                                                          | Backend     | `CONFIRMADO`                            |
| **4. Início**      | Data de início alcançada, status muda para ativo.                                    | Sistema     | `ATIVO`                                 |
| **5. Finalização** | Se houver dano, locatário é cobrado separadamente via nova preferência de pagamento. | Backend     | `DEVOLVIDO` → `DISPUTADO` → `CONCLUIDO` |

**Validações de Caução:**

- **Mínimo absoluto**: R$ 50,00
- **Mínimo obrigatório**: `valorAluguel + taxaApp` (garante cobertura do aluguel)
    - Exemplo: Aluguel R$ 100 → Caução mínima = R$ 100 + (R$ 100 × 10%) = R$ 110
- **Máximo**: R$ 10.000,00
- **Recomendado**: 100-150% do valor do aluguel (cobre aluguel + possíveis danos)
    - Exemplo: Aluguel R$ 100 → Caução recomendada = R$ 100 a R$ 150
- **Definida pelo locador** ao publicar o item
- **Validação no backend**: Sistema bloqueia criação de aluguel se `caucao < (valorAluguel + taxaApp)`

**Regras de Indenização:**

- **Máximo de indenização**: `caucao - valorAluguel - taxaApp` (não pode deixar saldo negativo)
- **Validação**: Sistema verifica se `indenizacao <= (caucao - valorAluguel - taxaApp)` antes de processar
- **Saldo insuficiente**: Se indenização excede saldo disponível, usa o máximo possível e registra diferença como "dívida pendente"
- **Exemplo**: Caução R$ 200, Aluguel R$ 100, Taxa R$ 10 → Indenização máxima = R$ 90

**Métodos de Pagamento Aceitos (enum `MetodoPagamento`):**

- `CARTAO_CREDITO`: Cartão de crédito (aprovação imediata)
- `CARTAO_DEBITO`: Cartão de débito (aprovação imediata)
- `PIX`: Pagamento via Pix (aprovação em segundos)
- `BOLETO`: Boleto bancário (aprovação em 1-3 dias úteis)
- `ACCOUNT_MONEY`: Saldo em conta Mercado Pago
- `DESCONHECIDO`: Método não identificado

**Observação:** Métodos com aprovação rápida (cartão/Pix) são recomendados para melhor experiência.

### **3.4.1 Validações de Transição de Estados**

Cada transição de estado possui validações específicas que devem ser cumpridas:

| Transição                         | Validações Obrigatórias                                                                | Permissões                    |
| --------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------- |
| `→ PAGAMENTO_PENDENTE`            | Item disponível, datas válidas, locatário verificado                                   | Locatário                     |
| `PAGAMENTO_PENDENTE → SOLICITADO` | Webhook Mercado Pago confirma pagamento, Caução status = `PAGA`                        | Sistema (webhook)             |
| `SOLICITADO → CONFIRMADO`         | Locador aceita solicitação dentro de 24h                                               | Locador                       |
| `SOLICITADO → CANCELADO`          | Timeout 24h OU Locador recusa (motivo obrigatório)                                     | Sistema ou Locador            |
| `CONFIRMADO → ATIVO`              | Data de início alcançada OU Locador inicia manualmente                                 | Sistema (cron) ou Locador     |
| `ATIVO → DEVOLVIDO`               | Locatário confirma devolução                                                           | Locatário                     |
| `DEVOLVIDO → CONCLUIDO`           | Locador confirma recebimento sem danos                                                 | Locador                       |
| `DEVOLVIDO → DISPUTADO`           | Locador reporta danos/problemas, anexa evidências                                      | Locador                       |
| `ATIVO → DISPUTADO`               | Qualquer parte abre disputa, motivo e evidências obrigatórios                          | Locador ou Locatário          |
| `DISPUTADO → CONCLUIDO`           | Mediação concluída, indenização processada (se houver)                                 | Sistema ou Moderador          |
| `* → CANCELADO`                   | Depende do estado: antes CONFIRMADO = grátis; após CONFIRMADO < 48h início = multa 10% | Locador, Locatário ou Sistema |

**Timeouts Automáticos:**

- `PAGAMENTO_PENDENTE`: 30 minutos → `CANCELADO` (se pagamento não confirmado)
- `SOLICITADO`: 24 horas → `CANCELADO` (se locador não responde)
- `DEVOLVIDO`: 48 horas → `CONCLUIDO` (confirmação automática se locador não responde)
- `DISPUTADO`: 7 dias → Escalado para moderação manual

### **3.5 Período de Aluguel**

| Check | Regra                     | Descrição                                                                                                                            | Prioridade |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| [ ]   | **Contagem de Tempo**     | Inicia quando `status = ATIVO`. Data/hora registrada em `dataInicio` do aluguel.                                                     | Alta       |
| [ ]   | **Data de Fim**           | Data de término registrada em `dataFim`. Sistema monitora via cron job diário.                                                       | Alta       |
| [ ]   | **Extensão do Aluguel**   | **[FUTURO]** Locatário pode solicitar extensão até 24h antes do fim. Locador tem 12h para aprovar. Cria novo pagamento proporcional. | Média      |
| [ ]   | **Atraso de Devolução**   | Multa calculada: `50% do precoPorDia * dias de atraso`. Máximo 5 dias. Após isso, `DISPUTADO` é aberto automaticamente.              | Alta       |
| [ ]   | **Lembretes Automáticos** | Cron job envia notificações push/email em: 48h, 24h e 2h antes do `dataFim`.                                                         | Média      |
| [ ]   | **Upload de Fotos**       | Locatário DEVE fazer upload de fotos do item no início (após aprovação) e no fim (antes da devolução). Tabela `verificacoes_fotos`.  | Alta       |

### **3.6 Devolução e Finalização**

| Check | Regra                        | Descrição                                                                                                                                                                                          | Prioridade |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Solicitação de Devolução** | Locatário clica em "Solicitar Devolução" no app. Upload de fotos finais obrigatório. Campo `observacoes` opcional.                                                                                 | Alta       |
| [ ]   | **Status de Transição**      | `ATIVO` → `DEVOLVIDO` (locatário marca como devolvido, aguardando confirmação do locador).                                                                                                         | Alta       |
| [ ]   | **Inspeção do Locador**      | Locador tem até 48h para: (1) Aprovar sem problemas, (2) Reportar danos e abrir disputa.                                                                                                           | Alta       |
| [ ]   | **Aprovação SEM DANO**       | Locador aprova. Backend executa `FinalizarAluguelUseCase` sem indenização. Calcula: `retornoLocatario = caucao - valorAluguel - taxaApp`. Status: `CONCLUIDO`. Caução: `DEVOLVIDA` (parcialmente). | Alta       |
| [ ]   | **Aprovação COM DANO**       | Locador reporta danos. Status: `DISPUTADO`. Sistema registra evidências e aguarda mediação. Indenização especificada.                                                                              | Alta       |
| [ ]   | **Resolução de Disputa**     | Após análise/mediação, sistema processa. Calcula: `retornoLocatario = caucao - valorAluguel - taxaApp - indenizacao`. Status: `DISPUTADO` → `CONCLUIDO`. Transferências processadas.               | Alta       |
| [ ]   | **Rejeição (Disputa)**       | Locador rejeita devolução. Motivo e fotos obrigatórios. Sistema cria registro de disputa. Pagamento retido até resolução.                                                                          | Alta       |
| [ ]   | **Timeout de Aprovação**     | Se locador não responder em 48h, sistema aprova automaticamente SEM DANO. Notificação enviada ao locador alertando sobre auto-aprovação.                                                           | Média      |
| [ ]   | **Finalização Prévia**       | Se locador confirma devolução antes do locatário solicitar, sistema vai direto para `CONCLUIDO`. Recomendado para entregas presenciais.                                                            | Média      |
| [ ]   | **Cálculo de Indenização**   | Definido pelo locador ou mediador. Máximo: valor total da caução. Descontado da caução antes da devolução.                                                                                         | Alta       |

---

## **4. Pagamentos e Finanças**

### **4.1 Integração Mercado Pago**

| Componente                | Descrição                                                                                            | Implementação                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Checkout Transparente** | **[FUTURO]** Pagamento dentro do app sem redirecionamento.                                           | API Mercado Pago SDK            |
| **Checkout Pro**          | **[ATUAL]** Redirecionamento para página de pagamento do Mercado Pago.                               | `init_point` da Preference API  |
| **Webhooks**              | Notificações automáticas sobre mudanças no status de pagamento. Endpoint: `/aluguel/webhook-caucao`. | `ProcessarWebhookCaucaoUseCase` |
| **Refund API**            | Reembolso automático da caução para o locatário.                                                     | `/v1/payments/{id}/refunds`     |
| **Transfer API**          | **[BLOQUEADO EM CONTA PF]** Transferências automáticas. MVP usa Pix manual.                          | Não disponível                  |

**Fluxo de Webhook:**

1. Mercado Pago envia POST para `/aluguel/webhook-caucao?data.id={payment_id}`
2. Backend busca detalhes do pagamento via API: `GET /v1/payments/{id}`
3. Atualiza status da caução e aluguel conforme `status` do pagamento
4. Envia notificação para locador e locatário

**Status de Pagamento Mapeados:**

- `approved` → Caução/Aluguel confirmado
- `pending` → Aguardando processamento (ex: boleto não pago)
- `in_process` → Em análise (cartão)
- `rejected` → Recusado
- `cancelled` → Cancelado
- `refunded` → Reembolsado

### **4.2 Cálculos Financeiros**

| Check | Regra                                | Descrição                                                                                                                                       | Prioridade |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Cálculo de Preço Base**            | `valorAluguel = precoPorDia × numeroDeDias`. Dias calculados: `(dataFim - dataInicio).dias + 1`. Mínimo 1 dia.                                  | Alta       |
| [ ]   | **Taxa da Plataforma**               | `taxaApp = valorAluguel × taxaAppPercentual`. Padrão: 10% (0.1). Configurável por aluguel (futuro: por categoria).                              | Alta       |
| [ ]   | **Valor Líquido Locador**            | `valorLiquidoLocador = valorAluguel - taxaApp`. Este é o valor que o locador deve receber.                                                      | Alta       |
| [ ]   | **Valor Total COM Caução**           | `valorTotal = valorAluguel + caucao`. Locatário paga isso no checkout.                                                                          | Alta       |
| [ ]   | **Valor Total SEM Caução**           | `valorTotal = valorAluguel`. Locatário paga apenas o aluguel.                                                                                   | Alta       |
| [ ]   | **Valor de Caução**                  | Definido pelo locador ao publicar item. Mínimo R$50, Máximo R$10.000. Recomendado: 20-50% do valor do item (não do aluguel).                    | Alta       |
| [ ]   | **Multa por Atraso**                 | `multaAtraso = (precoPorDia × 0.5) × diasDeAtraso`. Máximo: 5 dias. Após isso, problema escalado.                                               | Alta       |
| [ ]   | **Cálculo de Retorno ao Locatário**  | `retorno = caucao - valorAluguel - indenizacao - multaAtraso`. Se negativo, locatário deve pagar diferença.                                     | Alta       |
| [ ]   | **Liberação de Caução**              | Processada IMEDIATAMENTE após finalização do aluguel. Reembolso via Mercado Pago: 1-3 dias úteis para aparecer na conta.                        | Alta       |
| [ ]   | **Saldo Negativo**                   | Se `retorno < 0`, sistema cria nova preferência de pagamento para cobrar diferença. Locatário tem 5 dias para pagar. Após isso, conta suspensa. | Alta       |
| [ ]   | **Deep Links de Pagamento**          | Após pagamento no Mercado Pago, usuário é redirecionado via deep link: `coisarapida://payment/success?aluguelId=X&status=approved`.             | Média      |
| [ ]   | **Retenção em Disputa**              | Se aluguel está em `DISPUTADO`, todos os valores ficam retidos até resolução (máximo 30 dias). Após isso, liberação padrão.                     | Alta       |
| [ ]   | **Métodos de Pagamento (Locatário)** | Cartão crédito/débito, Pix, Boleto, Mercado Pago Account Money. Configurado no Mercado Pago Checkout.                                           | Alta       |
| [ ]   | **Métodos de Recebimento (Locador)** | Pix (chave CPF, email, telefone ou aleatória). Dados armazenados em `Usuario`: `chavePix`, `cpfPix`, `telefonePix`.                             | Alta       |

### **4.3 Tabela de Transferências (Auditoria)**

Todas as transferências são registradas na tabela `transferencias` para auditoria completa:

| Campo               | Descrição                       | Valores                                                                             |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------------------- |
| `tipo`              | Tipo de transferência           | `PAGAMENTO_LOCADOR`, `REEMBOLSO_LOCATARIO`, `INDENIZACAO`                           |
| `valor`             | Valor transferido               | Decimal(10,2)                                                                       |
| `status`            | Estado da transferência         | `PENDENTE`, `PROCESSANDO`, `AGUARDANDO_TRANSFERENCIA_MANUAL`, `CONCLUIDA`, `FALHOU` |
| `mpTransferenciaId` | ID da transação no Mercado Pago | String (quando aplicável)                                                           |
| `descricao`         | Descrição da transferência      | Ex: "Pagamento do aluguel - Furadeira Makita"                                       |
| `createdAt`         | Data de criação                 | Timestamp                                                                           |
| `completedAt`       | Data de conclusão               | Timestamp                                                                           |

**Status `AGUARDANDO_TRANSFERENCIA_MANUAL`:**

- Usado no MVP com conta PF
- Backend gera instruções: "Transferir R$X via Pix para [nome] (Chave: [chave])"
- Admin executa Pix manualmente
- Admin confirma no sistema via endpoint: `PATCH /aluguel/transferencia/confirmar`

---

## **5. Disputas e Resoluções**

### **5.1 Sistema de Problemas**

Diferenciamos **Problemas** (resolvidos entre usuários) e **Disputas** (escaladas para admin).

**Tabela: `problemas`**

| Campo          | Descrição                               | Tipo                                                  |
| -------------- | --------------------------------------- | ----------------------------------------------------- |
| `aluguelId`    | Aluguel relacionado                     | UUID FK                                               |
| `reportadoPor` | Quem reportou: `LOCADOR` ou `LOCATARIO` | Enum                                                  |
| `categoria`    | Categoria do problema                   | Enum (ver abaixo)                                     |
| `descricao`    | Descrição detalhada                     | Text                                                  |
| `status`       | Status do problema                      | Enum: `ABERTO`, `EM_ANALISE`, `RESOLVIDO`, `ESCALADO` |
| `resolucao`    | Como foi resolvido                      | Text                                                  |
| `evidencias`   | URLs de fotos/vídeos                    | JSONB array                                           |
| `createdAt`    | Data de abertura                        | Timestamp                                             |
| `resolvidoEm`  | Data de resolução                       | Timestamp                                             |

**Categorias de Problema:**

- `NAO_DEVOLUCAO`: Item não foi devolvido no prazo
- `ITEM_DANIFICADO`: Item foi devolvido com danos
- `ITEM_INCOMPLETO`: Falta acessórios ou partes
- `MAU_FUNCIONAMENTO`: Item não funciona corretamente
- `ATRASO_ENTREGA`: Locador atrasou a entrega
- `COMPORTAMENTO_INADEQUADO`: Falta de respeito/comunicação
- `COBRANCA_INDEVIDA`: Valor cobrado incorretamente
- `OUTRO`: Outros problemas

### **5.2 Fluxo de Disputa**

| Check | Regra                          | Descrição                                                                                                                                          | Prioridade |
| ----- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Abertura de Problema**       | Qualquer parte pode abrir problema durante aluguel ou até 7 dias após finalização. Status do aluguel vai para `DISPUTADO`.                         | Alta       |
| [ ]   | **Evidências Iniciais**        | Ao abrir, usuário deve anexar: descrição (mín 50 caracteres), categoria, fotos/vídeos (máx 10 arquivos, 5MB cada). Armazenado em JSONB.            | Alta       |
| [ ]   | **Notificação da Outra Parte** | Sistema notifica a outra parte via push + email. Ela tem 48h para responder com sua versão e evidências.                                           | Alta       |
| [ ]   | **Tentativa de Acordo**        | Ambas as partes podem negociar via chat do aluguel. Se entrarem em acordo, qualquer uma pode marcar problema como `RESOLVIDO`.                     | Média      |
| [ ]   | **Escalação para Admin**       | Se não houver acordo em 3 dias OU se qualquer parte solicitar, problema é escalado para `EM_ANALISE` por admin.                                    | Alta       |
| [ ]   | **Análise do Admin**           | Equipe de suporte analisa: (1) Evidências, (2) Histórico dos usuários, (3) Políticas da plataforma. Prazo: 5 dias úteis.                           | Alta       |
| [ ]   | **Decisão Final**              | Admin decide: (1) Indenização total/parcial ao locador, (2) Reembolso ao locatário, (3) Responsabilizar uma das partes. Registrado em `resolucao`. | Alta       |
| [ ]   | **Aplicação da Decisão**       | Se indenização, valor é abatido da caução ou cobrado separadamente. Sistema executa transferências conforme decisão.                               | Alta       |
| [ ]   | **Apelação**                   | Parte insatisfeita pode apelar em até 7 dias com novas evidências. Máximo 2 apelações. Após isso, decisão é final e irrevogável.                   | Média      |
| [ ]   | **Retenção de Pagamento**      | Enquanto `DISPUTADO`, todos os valores ficam congelados. Não há reembolso nem transferência até resolução.                                         | Alta       |
| [ ]   | **Bloqueio Preventivo**        | Usuário com >3 disputas em 6 meses tem conta marcada para `REVISAO_CONFORMIDADE`. Admin analisa padrão de comportamento.                           | Média      |
| [ ]   | **Penalidades**                | Se usuário é responsabilizado, pode receber: aviso, suspensão temporária (7-30 dias) ou banimento permanente.                                      | Alta       |

### **5.3 Sistema de Denúncias**

Separado de problemas de aluguel. Para denunciar comportamento grave.

**Tabela: `denuncias`**

| Campo            | Descrição                                                                             |
| ---------------- | ------------------------------------------------------------------------------------- |
| `denuncianteId`  | Quem denunciou (pode ser NULL se anônimo)                                             |
| `denunciadoId`   | Usuário denunciado                                                                    |
| `aluguelId`      | Aluguel relacionado (opcional)                                                        |
| `tipo`           | Tipo de denúncia: `FRAUDE`, `ABUSO`, `VIOLENCIA`, `ASSEDIO`, `ITEM_PROIBIDO`, `OUTRO` |
| `descricao`      | Descrição detalhada (obrigatório)                                                     |
| `evidencias`     | JSONB com URLs                                                                        |
| `status`         | `PENDENTE`, `EM_INVESTIGACAO`, `PROCEDENTE`, `IMPROCEDENTE`, `ARQUIVADA`              |
| `investigadorId` | Admin responsável pela investigação                                                   |
| `acaoTomada`     | Ação tomada se procedente                                                             |

**Fluxo:**

1. Usuário denuncia via botão no perfil ou aluguel
2. Sistema notifica equipe de segurança
3. Investigação em até 3 dias úteis
4. Se procedente: ações de acordo com gravidade (suspensão, banimento, polícia se criminal)
5. Se improcedente: arquivada

---

## **6. Segurança e Verificação**

| Check | Regra                             | Descrição                                                                                                                            | Prioridade |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| [ ]   | **Sistema de Denúncias**          | Usuários podem denunciar comportamento inadequado, fraude ou violações de segurança.                                                 | Alta       |
| [ ]   | **Denúncia Anônima**              | Denúncias podem ser anônimas, mas requerem detalhes específicos e evidências.                                                        | Média      |
| [ ]   | **Tipos de Denúncia**             | Não devolução, Atraso repetitivo, Danos recorrentes, Uso indevido, Comportamento inadequado, Fraude, Abuso sexual/violência, Outros. | Alta       |
| [ ]   | **Investigação de Denúncia**      | Equipe de segurança investiga em até 3 dias úteis.                                                                                   | Alta       |
| [ ]   | **Ações Punitivas**               | Aviso, redução de capacidade, suspensão temporária (7-30 dias) ou banimento permanente.                                              | Alta       |
| [ ]   | **Upload de Evidências de Fotos** | Locatário pode fazer upload de fotos do item no início (após aprovação) e no fim (na devolução).                                     | Alta       |
| [ ]   | **Verificação de Fotos**          | Sistema de IA detecta alterações nas fotos. Discrepâncias geram alerta para análise.                                                 | Baixa      |
| [ ]   | **Proteção de Dados**             | Endereço exato é oculto até confirmação mútua de datas. Apenas coordenadas aproximadas são mostradas.                                | Alta       |
| [ ]   | **Bloqueio de Usuário**           | Usuários podem bloquear contatos indesejados. Bloqueados não podem enviar solicitações de aluguel.                                   | Média      |

---

## **7. Comunicação e Notificações**

### **7.1 Sistema de Chat**

**Implementação:** Firestore para real-time + PostgreSQL para auditoria

| Check | Regra                       | Descrição                                                                                                                | Prioridade |
| ----- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| [ ]   | **Chat por Aluguel**        | Cada aluguel tem uma conversa dedicada em Firestore collection `conversas/{conversaId}/mensagens`.                       | Alta       |
| [ ]   | **Criação da Conversa**     | Conversa criada automaticamente quando aluguel é criado. `conversaId = aluguelId`.                                       | Alta       |
| [ ]   | **Participantes**           | Apenas locador e locatário podem enviar/ler mensagens. Admin pode ler se houver disputa.                                 | Alta       |
| [ ]   | **Tipos de Mensagem**       | `TEXTO`, `IMAGEM`, `DOCUMENTO`, `LOCALIZACAO`, `SISTEMA` (mensagens automáticas).                                        | Alta       |
| [ ]   | **Anexos**                  | Imagens: máx 5MB, formatos jpg/png. Documentos: máx 10MB, formatos pdf/doc/docx. Upload via Firebase Storage.            | Média      |
| [ ]   | **Mensagens de Sistema**    | Geradas automaticamente em eventos: "Aluguel aprovado", "Pagamento confirmado", "Devolução solicitada", etc.             | Alta       |
| [ ]   | **Acesso ao Perfil**        | Ambos podem clicar no nome/foto e ver perfil público: avaliações, histórico, reputação, tempo na plataforma.             | Alta       |
| [ ]   | **Retenção de Mensagens**   | Firestore: mantido enquanto usuários ativos. PostgreSQL: backup permanente em tabela `mensagens` para auditoria/disputa. | Média      |
| [ ]   | **Moderação Automática**    | Filtro de palavras ofensivas (lista customizável). Mensagens flagradas são bloqueadas e admin é notificado.              | Média      |
| [ ]   | **Indicador de Leitura**    | Firebase realtime: `lida: true/false` por mensagem. Atualizado quando usuário abre o chat.                               | Baixa      |
| [ ]   | **Notificação de Mensagem** | Se destinatário não leu em 5min, envia push notification. Agrupa múltiplas mensagens: "João enviou 3 mensagens".         | Alta       |

### **7.2 Sistema de Notificações**

**Implementação:** Firebase Cloud Messaging (push) + SendGrid (email) + Twilio (SMS)

**Tabela: `notificacoes`**

| Campo       | Descrição                                    |
| ----------- | -------------------------------------------- |
| `usuarioId` | Destinatário                                 |
| `tipo`      | Tipo de notificação (enum, ver abaixo)       |
| `titulo`    | Título curto                                 |
| `mensagem`  | Mensagem completa                            |
| `dados`     | JSONB com dados contextuais (aluguelId, etc) |
| `lida`      | Boolean                                      |
| `canais`    | Array: `['PUSH', 'EMAIL', 'SMS']`            |
| `enviadaEm` | Timestamp                                    |

**Tipos de Notificação e Canais:**

| Tipo                     | Quando                         | Push | Email | SMS | Prioridade |
| ------------------------ | ------------------------------ | ---- | ----- | --- | ---------- |
| `ALUGUEL_SOLICITADO`     | Locatário solicita aluguel     | ✅   | ✅    | ❌  | Alta       |
| `ALUGUEL_APROVADO`       | Locador aprova                 | ✅   | ✅    | ✅  | Alta       |
| `ALUGUEL_RECUSADO`       | Locador recusa                 | ✅   | ✅    | ❌  | Média      |
| `PAGAMENTO_CONFIRMADO`   | Webhook confirma pagamento     | ✅   | ✅    | ❌  | Alta       |
| `PAGAMENTO_FALHOU`       | Webhook reporta falha          | ✅   | ✅    | ✅  | Crítica    |
| `ALUGUEL_INICIADO`       | Status → ATIVO                 | ✅   | ❌    | ❌  | Média      |
| `LEMBRETE_DEVOLUCAO_48H` | 48h antes do fim               | ✅   | ✅    | ❌  | Alta       |
| `LEMBRETE_DEVOLUCAO_24H` | 24h antes do fim               | ✅   | ✅    | ✅  | Alta       |
| `LEMBRETE_DEVOLUCAO_2H`  | 2h antes do fim                | ✅   | ❌    | ❌  | Média      |
| `DEVOLUCAO_SOLICITADA`   | Locatário solicita devolução   | ✅   | ✅    | ❌  | Alta       |
| `DEVOLUCAO_APROVADA`     | Locador aprova devolução       | ✅   | ✅    | ❌  | Alta       |
| `ALUGUEL_FINALIZADO`     | Sistema finaliza aluguel       | ✅   | ✅    | ❌  | Alta       |
| `REEMBOLSO_PROCESSADO`   | Reembolso enviado              | ✅   | ✅    | ❌  | Alta       |
| `PAGAMENTO_RECEBIDO`     | Locador deve receber Pix       | ✅   | ✅    | ❌  | Alta       |
| `PROBLEMA_ABERTO`        | Problema reportado             | ✅   | ✅    | ✅  | Crítica    |
| `DISPUTA_RESOLVIDA`      | Admin resolve disputa          | ✅   | ✅    | ✅  | Crítica    |
| `AVALIACAO_PENDENTE`     | Lembrete para avaliar (7 dias) | ✅   | ✅    | ❌  | Baixa      |
| `MENSAGEM_RECEBIDA`      | Nova mensagem no chat          | ✅   | ❌    | ❌  | Baixa      |
| `VERIFICACAO_APROVADA`   | Doc aprovado                   | ✅   | ✅    | ❌  | Média      |
| `VERIFICACAO_REJEITADA`  | Doc rejeitado                  | ✅   | ✅    | ❌  | Alta       |

**Regras de Throttling:**

- Máximo 2 notificações push por hora do mesmo aluguel (exceto eventos críticos)
- Eventos críticos: `PAGAMENTO_FALHOU`, `PROBLEMA_ABERTO`, `DISPUTA_RESOLVIDA`
- Emails de marketing: máximo 2 por semana
- SMS: apenas para eventos prioritários (aprovação, lembretes 24h, problemas)

**Preferências do Usuário:**
Tabela `usuario_preferencias_notificacao`:

- Usuário pode desabilitar canais por tipo de notificação
- Padrão: Todos habilitados
- Críticos não podem ser desabilitados (problemas, pagamentos)

---

## **8. Anúncios e Itens**

### **8.1 Publicação e Moderação**

| Check | Regra                             | Descrição                                                                                                                   | Prioridade |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [x]   | **Requisitos para Publicar**      | Usuário deve ter: email verificado + telefone verificado + endereço verificado.                                             | Alta       |
| [x]   | **Dados Obrigatórios**            | Nome, descrição, categoria, mín 1 fotos, precoPorDia, valorCaucao (opcional), localizacao.                                  | Alta       |
| [x]   | **Fotos do Anúncio**              | Mínimo 1 fotos, máximo 3. Formatos: JPG/PNG. Tamanho máx: 5MB cada. Armazenadas no cloudinary.                              | Alta       |
| [x]   | **Descrição**                     | Mínimo 50 caracteres, máximo 2000. Deve incluir: estado do item, funcionalidades, limitações, o que está incluso.           | Alta       |
| [x]   | **Preço**                         | `precoPorDia`: obrigatório, mínimo R$5. `precoPorHora`: opcional (futuro). Máximo: R$10.000/dia.                            | Alta       |
| [x]   | **Caução**                        | `valorCaucao`: opcional mas recomendado. Se não definido, sistema sugere 30% do valor do item. Mín R$50, máx R$10.000.      | Média      |
| [x]   | **Localização**                   | Coordenadas (lat/lng) extraídas do endereço via Google Maps API. Endereço completo oculto até aprovação do aluguel.         | Alta       |
| [x]   | **Moderação Automática**          | Sistema detecta palavras proibidas, links externos, números de telefone. Item fica em `status: PENDENTE` até revisão.       | Alta       |
| [x]   | **Status do Item**                | `RASCUNHO`, `PENDENTE`, `ATIVO`, `INATIVO`, `ARQUIVADO`, `BLOQUEADO`, `EXCLUIDO`.                                           | Alta       |
| [ ]   | **Remoção de Anúncio**            | Locador pode inativar a qualquer momento.                                                                                   | Alta       |
| [ ]   | **Arquivamento Automático**       | Itens sem visualizações em 90 dias: status → `ARQUIVADO`. Notificação enviada ao locador. Pode reativar editando o anúncio. | Média      |
| [ ]   | **Calendário de Disponibilidade** | Tabela `disponibilidades`: Locador pode bloquear datas específicas. Sistema valida ao criar aluguel.                        | Alta       |

### **8.2 Categorias e Tipos**

**Categorias Principais:**

- `ELETRONICOS`: Notebooks, câmeras, drones, consoles, etc
- `FERRAMENTAS`: Furadeiras, serras, escadas, equipamentos
- `ESPORTES`: Bicicletas, skates, equipamento de camping, pranchas
- `EVENTOS`: Decorações, mesas, cadeiras, tendas
- `MODA`: Roupas, bolsas, acessórios para ocasiões
- `MOBILIAS`: Sofás, mesas, estantes (para mudanças temporárias)
- `VEICULOS`: Carros, motos, trailers (futuro, requer seguro)
- `LIVROS_MIDIAS`: Livros, jogos, CDs
- `OUTROS`: Itens que não se encaixam

**Tipos de Anúncio:**

- `ALUGUEL`: Item disponível para aluguel (padrão)
- `VENDA`: Item disponível para venda (futuro)
- `AMBOS`: Pode alugar ou vender (futuro)

**Estado do Item:**

- `NOVO`: Nunca usado, na embalagem
- `COMO_NOVO`: Usado poucas vezes, perfeito estado
- `BOM`: Usado, funcional, pequenos sinais de uso
- `REGULAR`: Usado, funcional, sinais visíveis de uso
- `PARA_CONSERTAR`: Não funcional (apenas venda)

### **8.3 Busca e Recomendação**

| Check | Regra                           | Descrição                                                                                               | Prioridade |
| ----- | ------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------- |
| [x]   | **Busca por Texto**             | ElasticSearch ou PostgreSQL Full-Text Search em `nome`, `descricao`, `categoria`.                       | Alta       |
| [x]   | **Busca por Texto (Full-Text)** | PostgreSQL Full-Text Search com tsvector e suporte a português. Performance 50-100x superior ao LIKE.   | Alta       |
| [x]   | **Busca Geográfica**            | PostGIS: `ST_DWithin` para buscar itens dentro de X km do usuário. Padrão: 10km.                        | Alta       |
| [x]   | **Filtros**                     | Categoria, preço (min/max), disponibilidade (datas), distância, avaliação mínima, aprovação automática. | Alta       |
| [x]   | **Ordenação**                   | Relevância, preço (crescente/decrescente), distância, avaliação, mais alugados.                         | Média      |
| [ ]   | **Recomendações**               | **[FUTURO]** Baseado em histórico de buscas/aluguéis. ML para sugestões personalizadas.                 | Baixa      |

---

## **9. Conformidade e Política**

| Check | Regra                                     | Descrição                                                                                                     | Prioridade |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **LGPD - Lei Geral de Proteção de Dados** | Conformidade total com LGPD. Usuários podem solicitar relatório de dados a qualquer tempo.                    | Alta       |
| [ ]   | **Termos de Uso**                         | Todos os usuários devem aceitar Termos de Uso e Política de Privacidade antes de transações.                  | Alta       |
| [ ]   | **Proibições Gerais**                     | Itens ilegais, perigosos, falsificados ou que violem direitos autorais são proibidos.                         | Alta       |
| [ ]   | **Timeout de Inatividade**                | Sessão expira após 30 minutos de inatividade. Re-autenticação necessária para continuar.                      | Média      |
| [ ]   | **Limite de Transações**                  | Novo usuário começa com limite de 3 transações simultâneas. Aumenta para 10 após 10 transações bem-sucedidas. | Média      |

---

## **10. Eventos de Domínio e Integrações**

### **10.1 Domain Events (DDD)**

Sistema de eventos para comunicação entre agregados (implementar com NestJS EventEmitter):

| Evento                | Quando                     | Handlers                                                           |
| --------------------- | -------------------------- | ------------------------------------------------------------------ |
| `AluguelCriado`       | Aluguel criado             | → Criar conversa no Firestore, → Notificar locador                 |
| `CaucaoPaga`          | Webhook confirma pagamento | → Atualizar status aluguel, → Iniciar aluguel, → Notificar ambos   |
| `AluguelIniciado`     | Status → ATIVO             | → Enviar lembretes agendados, → Criar tarefas cron                 |
| `DevolucaoSolicitada` | Locatário solicita         | → Notificar locador, → Agendar timeout de 48h                      |
| `AluguelFinalizado`   | Sistema finaliza           | → Processar transferências, → Liberar item, → Solicitar avaliações |
| `ProblemaAberto`      | Problema reportado         | → Notificar outra parte, → Alertar admin se crítico                |
| `DisputaResolvida`    | Admin resolve              | → Executar decisão, → Notificar ambos, → Atualizar reputações      |
| `VerificacaoAprovada` | Doc aprovado               | → Atualizar status usuário, → Notificar, → Liberar funcionalidades |

### **10.2 Cron Jobs (Tarefas Agendadas)**

**Implementação:** NestJS @Cron ou Bull Queue

| Tarefa                         | Frequência   | Descrição                                                                                          |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------------- |
| `verificar_alugueis_atrasados` | A cada 6h    | Busca aluguéis com `dataFim < NOW()` e status `ATIVO`. Calcula multa e notifica locador.           |
| `enviar_lembretes_devolucao`   | A cada 1h    | Busca aluguéis que terminam em 48h, 24h ou 2h. Envia notificações.                                 |
| `finalizar_alugueis_expirados` | Diariamente  | Aluguéis em `DEVOLUCAO_PENDENTE` há mais de 48h → Auto-aprovar devolução.                          |
| `arquivar_itens_inativos`      | Semanalmente | Itens sem visualizações em 90 dias → Status `ARQUIVADO`.                                           |
| `lembrar_avaliacoes_pendentes` | Diariamente  | Aluguéis finalizados há 3 dias sem avaliação → Notificar. Após 7 dias, marcar como "não avaliado". |
| `limpar_caucoes_expiradas`     | Diariamente  | Cauções `AGUARDANDO_PAGAMENTO` há mais de 24h → Cancelar aluguel.                                  |
| `sincronizar_firebase_pg`      | A cada 5min  | Sincroniza mudanças no Firestore (mensagens, itens) para PostgreSQL (auditoria).                   |

### **10.3 Integrações Externas**

| Serviço                    | Uso                                                       | Endpoints                                         |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| **Mercado Pago**           | Pagamentos e reembolsos                                   | Preference API, Payment API, Refund API, Webhooks |
| **Firebase Auth**          | Autenticação de usuários                                  | Admin SDK no backend para validar tokens          |
| **Firebase Storage**       | Upload de imagens                                         | Admin SDK para gerar URLs assinadas               |
| **Firestore**              | Chat real-time e sincronização                            | Admin SDK para CRUD                               |
| **Firebase Messaging**     | Push notifications                                        | Admin SDK para enviar notificações                |
| **SendGrid**               | Email transacional                                        | REST API v3                                       |
| **Twilio**                 | SMS (verificação e notificações)                          | REST API                                          |
| **Google Maps API**        | Geocoding e distâncias                                    | Geocoding API, Distance Matrix API                |
| **AWS S3 / Cloudflare R2** | **[FUTURO]** Storage de imagens (alternativa ao Firebase) | SDK                                               |

---

## **11. Considerações Técnicas para o Time de Dev**

### **11.1 Arquitetura Backend (NestJS + PostgreSQL)**

**Princípios DDD Implementados:**

- ✅ **Agregados:** Usuario, Item, Aluguel, Conversa como roots
- ✅ **Value Objects:** Endereco, Transferencia
- ✅ **Domain Events:** Para comunicação entre agregados
- ✅ **Repositories:** Interface na camada de domínio, implementação em infra
- ✅ **Use Cases:** Lógica de aplicação isolada em `application/usecases/`
- ✅ **Domain Services:** Lógica de negócio complexa em `domain/services/`

**Estrutura de Pastas por Módulo:**

```
src/modules/{modulo}/
├── domain/              # Entities + Domain Services
│   ├── {Entidade}.ts
│   └── services/
├── application/         # Use Cases + DTOs
│   ├── usecases/
│   ├── dtos/
│   ├── queries/
│   └── services/        # Application Services
├── infra/               # Implementações técnicas
│   ├── models/          # TypeORM Entities
│   ├── repositories/    # Implementação dos repositórios
│   └── services/        # Serviços externos (MP, Firebase)
└── {Modulo}.controller.ts  # REST API endpoints
```

**Validações:**

- DTOs: `class-validator` + `class-transformer`
- Domain: Métodos de validação nas entidades
- Guards: JWT + Firebase Auth integration
- Pipes: ValidationPipe global

**Tratamento de Erros:**

- Custom exceptions: `NotFoundException`, `BadRequestException`, etc
- Global Exception Filter para padronizar responses
- Logging: Winston ou Pino

### **11.2 Arquitetura Frontend (Flutter + Riverpod)**

**Feature-Based Architecture:**

```
lib/features/{feature}/
├── data/
│   ├── models/          # DTOs + Serialização JSON
│   └── repositories/    # Implementação (HTTP, Firestore)
├── domain/
│   ├── entities/        # Entidades de negócio
│   └── repositories/    # Interfaces abstratas
└── presentation/
    ├── controllers/     # Lógica de UI (se necessário)
    ├── pages/           # Telas
    ├── providers/       # Riverpod providers
    └── widgets/         # Componentes reutilizáveis
```

**State Management:**

- Riverpod com code generation (`riverpod_annotation`)
- `AsyncValue` para loading/error/data states
- `@riverpod` para auto-dispose providers
- StateNotifier/Notifier para estados complexos

**Navegação:**

- GoRouter para declarative routing
- Deep links: `coisarapida://`
- Guards de autenticação

### **11.3 Sincronização Firebase ↔ PostgreSQL**

**Estratégia:**

1. **Autenticação:** Firebase Auth é source of truth
    - User criado no Firebase → Webhook/Cloud Function → Backend cria em PostgreSQL
    - `firebaseUid` = `usuarios.id` (UUID no PostgreSQL)

2. **Chat:** Firestore para real-time, PostgreSQL para auditoria
    - Mensagens escritas no Firestore
    - Cloud Function ou backend syncroniza para PostgreSQL diariamente

3. **Itens:** Híbrido
    - Dados mestres no PostgreSQL
    - Cache/busca no Firestore para performance
    - Atualização: PostgreSQL → Firestore

**Fluxo de Autenticação:**

```
1. Flutter → Firebase Auth login
2. Firebase retorna JWT token
3. Flutter → Backend (header: Bearer {token})
4. Backend valida token via Firebase Admin SDK
5. Backend extrai UID e busca usuário no PostgreSQL
6. Backend autoriza/rejeita request
```

### **11.4 Testes**

**Backend (NestJS):**

- Unit Tests: Jest para use cases e domain services
- Integration Tests: Supertest para endpoints
- E2E Tests: Com banco de dados em Docker
- Coverage mínimo: 70%

**Frontend (Flutter):**

- Unit Tests: Para models e repositories
- Widget Tests: Para componentes
- Integration Tests: Para fluxos completos
- Golden Tests: Para UI consistency

### **11.5 CI/CD**

**Pipeline Sugerido:**

```yaml
1. Lint & Format Check
2. Run Tests (unit + integration)
3. Build (backend + frontend)
4. Deploy Staging:
   - Backend: Railway/Render/AWS ECS
   - Frontend: Firebase Hosting (web) / TestFlight+PlayStore Internal (mobile)
5. E2E Tests em Staging
6. Deploy Production (manual approval)
7. Monitoring: Sentry + Firebase Crashlytics
```

### **11.6 Variáveis de Ambiente Necessárias**

**Backend (.env):**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_SYNC=false  # NUNCA true em produção

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Mercado Pago
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=

# Comunicação
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
JWT_SECRET=
APP_URL=https://app.coisarapida.com
ADMIN_EMAIL=admin@coisarapida.com
```

**Frontend (Flutter):**

- Firebase config: `firebase_options.dart` (gerado via FlutterFire CLI)
- Backend URL: Flavor-based (dev/staging/prod)
- Mercado Pago Public Key

---

## **12. Roadmap de Melhorias Futuras**

| Funcionalidade                          | Descrição                                                               | Trimestre Estimado |
| --------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| **Checkout Transparente**               | Pagamento dentro do app (Mercado Pago SDK).                             | Q1 2026            |
| **Transferências Automáticas**          | Migrar para conta PJ do Mercado Pago com split payments.                | Q2 2026            |
| **Seguro de Aluguel**                   | Parceria com seguradora para itens de alto valor (>R$5.000).            | Q2 2026            |
| **Programa de Referência**              | Usuários ganham R$10 de crédito ao indicar novos usuários.              | Q1 2026            |
| **Verificação via Face ID**             | Autenticação biométrica + liveness detection.                           | Q3 2026            |
| **Marketplace de Serviços**             | Limpeza, reparo e transporte de itens como add-ons pagos.               | Q2 2026            |
| **API de Integração (B2B)**             | Empresas integram catálogo em seus sistemas. Rate limit + API keys.     | Q3 2026            |
| **Aluguel Recorrente**                  | Assinatura mensal/semanal de itens. Auto-renovação.                     | Q1 2026            |
| **Análise Preditiva (ML)**              | Recomendações personalizadas, previsão de demanda, detecção de fraudes. | Q4 2026            |
| **Entrega via Correios/Transportadora** | Integração Melhor Envio para itens pequenos.                            | Q2 2026            |
| **Pagamento Parcelado**                 | Parcelamento em 2-12x (taxa extra para locatário).                      | Q3 2026            |

---

## **13. KPIs e Métricas de Sucesso**

| Métrica                             | Meta                                   | Frequência |
| ----------------------------------- | -------------------------------------- | ---------- |
| Taxa de Conversão                   | 15% de visitantes para usuários ativos | Mensal     |
| Taxa de Retenção                    | 60% de usuários ativos após 30 dias    | Mensal     |
| Satisfação do Usuário (NPS)         | Mínimo 50                              | Trimestral |
| Tempo Médio de Resolução de Disputa | < 5 dias                               | Mensal     |
| Taxa de Fraude Detectada            | < 0.5% de transações                   | Mensal     |
| Avaliação Média de Itens            | Mínimo 4.2 estrelas                    | Mensal     |

---

## **14. Edge Cases e Cenários Especiais**

### **14.1 Cancelamentos e Reembolsos**

| Cenário                                           | Regra                                                               | Valor Reembolsado               |
| ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------- |
| **Cancelamento antes de pagar**                   | Gratuito                                                            | N/A                             |
| **Cancelamento após pagar, >48h antes do início** | Reembolso total menos taxa processamento (3%)                       | 97%                             |
| **Cancelamento <48h antes do início**             | Multa de 10% do valor do aluguel                                    | 90% do aluguel + 100% da caução |
| **Cancelamento pelo locador após aprovação**      | Locatário recebe reembolso total + R$20 de crédito como compensação | 100% + crédito                  |
| **Item não disponível no início**                 | Locador cancela, locatário recebe reembolso + crédito               | 100% + R$50 crédito             |

### **14.2 Problemas de Pagamento**

| Cenário                         | Ação do Sistema                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Pagamento recusado (cartão)** | Status: `PAGAMENTO_FALHOU`. Notificar locatário. Aluguel cancelado automaticamente em 24h se não pagar.      |
| **Chargeback (contestação)**    | Pagamento retido. Investigação automática. Se procedente: reverter transação. Se fraudulento: banir usuário. |
| **Reembolso demora >5 dias**    | Sistema abre ticket automático para equipe financeira. Notifica usuário sobre atraso.                        |
| **Mercado Pago indisponível**   | Queue de pagamentos. Tentar novamente a cada 30min. Notificar usuário sobre instabilidade temporária.        |

### **14.3 Disputas Complexas**

| Cenário                                         | Resolução                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ambos alegam o outro está mentindo**          | Admin analisa: (1) Histórico de ambos, (2) Padrão de disputas anteriores, (3) Fotos enviadas no início/fim, (4) Conversas no chat.          |
| **Item perdido/roubado**                        | Locatário deve fazer B.O. (Boletim de Ocorrência). Se comprovado roubo: indenização parcial (70% do valor). Se perda por negligência: 100%. |
| **Item quebrou durante uso normal**             | Se wear and tear normal: sem indenização. Se uso indevido: indenização parcial. Análise caso a caso.                                        |
| **Locador não quer devolver caução sem motivo** | Após 48h, sistema libera automaticamente se locador não justificar rejeição.                                                                |

### **14.4 Múltiplos Aluguéis Simultâneos**

| Cenário                               | Validação                                                                                                                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Item alugado em datas sobrepostas** | Backend valida antes de criar: `SELECT * FROM alugueis WHERE itemId = X AND status IN ('CONFIRMADO', 'ATIVO', 'DEVOLVIDO') AND (dataInicio <= :fim AND dataFim >= :inicio)`. Se existe, bloqueia. |
| **Locatário aluga múltiplos itens**   | Permitido. Limite: 10 aluguéis simultâneos (configurável por reputação).                                                                                                                          |
| **Locador com múltiplos itens**       | Sem limite. Gerencia cada item independentemente.                                                                                                                                                 |

### **14.5 Situações de Força Maior**

| Evento                         | Política                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **Pandemia/Lockdown**          | Aluguel pode ser pausado sem penalidade. Caução mantida. Reativar quando normalizar. |
| **Desastre Natural**           | Se item for destruído: sem indenização. Se comprovado seguro, seguradora paga.       |
| **Morte do locador/locatário** | Herdeiros/contato de emergência podem finalizar. Caução liberada conforme situação.  |

---

## **15. Suporte ao Usuário**

| Check | Regra                     | Descrição                                                                                                              | Prioridade |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| [ ]   | **Canais de Suporte**     | E-mail (suporte@coisarapida.com), chat in-app (Intercom/Zendesk), WhatsApp Business. Disponível 24/7 para emergências. | Alta       |
| [ ]   | **Tempo de Resposta**     | E-mail: 24h. Chat: 2h durante horário comercial (9h-18h BRT). WhatsApp: 4h para problemas críticos.                    | Alta       |
| [ ]   | **FAQ e Help Center**     | Central de ajuda com artigos detalhados. Chatbot (Dialogflow) responde 70% das perguntas automaticamente.              | Média      |
| [ ]   | **Escalação**             | Problemas não resolvidos em 48h são escalados para especialista. SLA: resolução em 5 dias úteis.                       | Alta       |
| [ ]   | **Contato de Emergência** | Telefone de emergência para situações críticas (acidentes, itens roubados): 0800-XXX-XXXX.                             | Alta       |
| [ ]   | **Suporte via Admin**     | Equipe de admin pode acessar aluguéis, ver chats (apenas em disputas), e tomar ações como suspender contas.            | Alta       |

---

## **16. Glossário de Termos**

| Termo                  | Definição                                                             |
| ---------------------- | --------------------------------------------------------------------- |
| **Locador**            | Proprietário do item que está alugando                                |
| **Locatário**          | Pessoa que está alugando o item                                       |
| **Caução (Escrow)**    | Valor retido como garantia, liberado após devolução                   |
| **Indenização**        | Compensação por danos ao item                                         |
| **Taxa da Plataforma** | Comissão cobrada pela plataforma (10% do valor do aluguel)            |
| **Preferência (MP)**   | Configuração de pagamento no Mercado Pago                             |
| **Webhook**            | Notificação automática de eventos externos (ex: pagamento confirmado) |
| **Deep Link**          | Link que abre o app diretamente em uma tela específica                |
| **Agregado**           | Cluster de objetos de domínio tratados como unidade (DDD)             |
| **Use Case**           | Ação específica do sistema (ex: "Criar Aluguel")                      |
| **Domain Event**       | Evento de negócio que ocorreu (ex: "Aluguel Finalizado")              |

---
