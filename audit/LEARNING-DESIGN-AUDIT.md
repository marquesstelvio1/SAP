# SAPTM — Learning Design Audit

> **Departamento:** Learning Design  
> **Data:** 2026-06-30  
> **Versão:** 1.0  
> **Âmbito:** 8 páginas MVP (Dashboard, Cargo, Tracking, Tracking Detail, Planning, Capacity, Tariffs, Integrations, Admin)  
> **Público-alvo:** Operadores logísticos portugueses — Carlos (Operador de Cargas), Marta (Planeadora), Rui (Gestor de Operações)  
> **Stack:** Next.js 16, shadcn/ui new-york, Tailwind v4, @saptm/ui (AccessState, EmptyState, ErrorCard, MetricTile, ContextRow, DataTable, Tooltip)

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Empty State Evaluation](#2-empty-state-evaluation)
3. [Error Message Assessment (Feynman Technique)](#3-error-message-assessment-feynman-technique)
4. [Onboarding Recommendations](#4-onboarding-recommendations)
5. [Microlearning Opportunities](#5-microlearning-opportunities)
6. [Avaliação por Persona](#6-avaliação-por-persona)
7. [Prioridade de Implementação](#7-prioridade-de-implementação)

---

## 1. Resumo Executivo

**Nota global de learnability: 4.2 / 10** — A plataforma está estruturalmente sólida (boas labels PT-PT, terminologia operacional consistente), mas **não ensina o utilizador a usar o sistema**. Um operador logístico novo (Carlos, Marta ou Rui) chega a uma página vazia ou com erro e não sabe o que fazer a seguir.

### Achados críticos

| # | Problema | Severidade | Páginas afectadas |
|---|----------|------------|-------------------|
| 1 | Empty states sem CTA — dizem o que falta mas não o que fazer | 🔴 Alta | Todas (excepto Dashboard) |
| 2 | Mensagens de erro expõem `error.message` técnico | 🔴 Alta | Cargo, Tracking, OperationsSnapshot |
| 3 | Zero onboarding para novos utilizadores | 🔴 Alta | Todas |
| 4 | Zero help contextual (tooltips, help links, documentação) | 🔴 Alta | Todas |
| 5 | Admin expõe "Tenant ID", "Slug", "RBAC" na UI | 🟡 Média | Admin |
| 6 | Integrações ainda mostra "Integration Gateway P13" | 🟡 Média | Integrations |
| 7 | Tracking Detail usa badges "Pode gerir" / "Somente leitura" | 🟡 Média | Tracking Detail |
| 8 | Sem distinção entre "sistema vazio" e "utilizador sem dados" | 🟡 Média | Cargo, Tracking |

---

## 2. Empty State Evaluation

Cada página foi avaliada pela qualidade do empty state quando não há dados:
- **Guia o utilizador?** — diz o que fazer a seguir?
- **Linguagem PT-PT operacional?** — sem developer-facing terms?
- **CTA accionável?** — botão ou link para a acção seguinte?
- **Contexto emocional?** — reduz ansiedade do "o que faço agora?"

### Tabela de Avaliação

| Página | Empty State (texto) | CTA? | PT-PT? | Guia o próximo passo? | Rating |
|--------|---------------------|------|--------|----------------------|--------|
| **Dashboard** | `AccessState` com "A carregar resumo operacional" (loading) | ❌ | ✅ | Parcial — mostra que está a carregar, mas se não há dados retorna `null` silenciosamente | ⭐⭐ |
| **Cargo** | "Nenhum dado encontrado. Nao ha dados de cargas disponiveis no momento. Verifique se ha cargas registradas." | ❌ Sem botão | ✅ | ❌ — "Verifique se há cargas registadas" não é accionável para um novo operador que nunca registou nada | ⭐ |
| **Tracking** | "Nenhum dado encontrado. Nao ha dados de tracking disponiveis no momento. Verifique se ha remessas registradas." | ❌ Sem botão | ✅ | ❌ — Mesmo problema do Cargo. Não diz como criar a primeira remessa | ⭐ |
| **Planning** | "Nenhuma ordem de transporte encontrada." (tabela vazia) | ❌ | ✅ | ❌ — Apenas informa que está vazio, não guia para criar ordem | ⭐ |
| **Capacity** | "Sem slots abertos ou historicos registados." / "Sem reservas registadas." | ❌ | ✅ | ❌ — Não diz como abrir o primeiro slot ou fazer a primeira reserva | ⭐⭐ |
| **Tariffs** | "Sem rate cards ativos registados." / "Sem cotacoes registadas." | ❌ | Parcial ("rate card" é termo estrangeiro) | ❌ — Não sugere criar rate card ou solicitar tarifário | ⭐ |
| **Integrations** | "Nenhuma service account criada para esta organizacao." | ❌ | ❌ "service account" em PT-PT seria "conta de serviço" | ❌ — Não guia para criar a primeira conta | ⭐ |
| **Admin** | `AdminUsersTable` / `AdminRolesTables` — não analisado em detalhe, mas passa dados sem fallback explícito na página | ❌ | ✅ | ❌ — Sem empty state visível no page.tsx para utilizadores ou roles | ⭐⭐ |
| **Tracking Detail** | "Nenhum evento operacional registado para esta carga." (timeline vazia) | ❌ | ✅ | ❌ — Não sugere registar o primeiro evento | ⭐⭐ |

### Problema comum a todas as páginas

Nenhum empty state tem um botão de acção. O componente `EmptyState` da `@saptm/ui` **suporta `action` prop**, mas nenhuma página a usa. O operador vê um ecrã vazio e não sabe o próximo passo.

**Recomendação geral:** Em cada empty state, adicionar um CTA que leve o operador à primeira acção útil:

```tsx
<EmptyState
  icon={<PackageIcon />}
  title="Nenhuma carga registada"
  description="Registe a primeira carga para começar a operar. Precisa do conhecimento de carga e dados do transporte."
  action={<Button>Registar primeira carga</Button>}
/>
```

---

## 3. Error Message Assessment (Feynman Technique)

Aplicámos a **Feynman Technique**: um erro deve ser explicado como se fosse para uma criança de 10 anos — ou para um operador logístico sem background técnico (Carlos, Marta, Rui).

### 3.1. Erros que passam no teste de Feynman ✅

| Página | Mensagem actual | Porque passa |
|--------|----------------|--------------|
| Dashboard | "Resumo operacional indisponivel" + "O utilizador autenticado nao tem acesso ao modulo de tracking." | Explica o problema em PT-PT, sugere acção ("contacte o gestor") |
| Dashboard | (ErrorCard inexistente — usa card próprio) "Resumo operacional indisponivel" com badge "Erro" | Linguagem simples, mas mensagem técnica do erro ainda é exposta (ver 3.2) |
| Planning | "Nao foi possivel carregar os dados de planeamento. Tente novamente." + ErrorCard com retry | Diz o que correu mal (sem detalhes técnicos) e o que fazer (tentar de novo) |
| Cargo | "Gestao de cargas bloqueada" + "O utilizador autenticado nao tem acesso ao modulo de gestao de cargas." | Explica o bloqueio, não expõe permissões internas |
| Tracking | "Tracking operacional bloqueado" + "O utilizador autenticado nao tem acesso ao modulo de tracking." | Mesmo — linguagem limpa |

### 3.2. Erros que NÃO passam no teste de Feynman ❌

| Página | Mensagem actual | Problema (Feynman) | Correcção proposta |
|--------|----------------|--------------------|--------------------|
| **OperationsSnapshot** | `overviewQuery.error instanceof Error ? overviewQuery.error.message : "Erro ao carregar dados de tracking."` | **Expõe `error.message` bruto** — pode mostrar "500 Internal Server Error", "Connection refused", "ECONNRESET", "prisma error" etc. Carlos não percebe nada disto. | "Não foi possível carregar o resumo operacional. Tente novamente ou contacte o apoio técnico." |
| **Cargo** | `cargoQuery.error instanceof Error ? cargoQuery.error.message : "Erro ao carregar dados de cargas."` | **Mesmo problema** — o erro técnico bruto aparece no ecrã. Se a base de dados falhar, Carlos vê "prisma: connection error". | "Erro ao carregar as cargas. A equipa de operações foi notificada. Tente novamente mais tarde." |
| **Tracking** | `overviewQuery.error instanceof Error ? overviewQuery.error.message : "Erro ao carregar dados de tracking."` | **Mesmo padrão** — erro técnico exposto. Marta não percebe "timeout" ou "network error". | "Tracking temporariamente indisponível. Os dados serão actualizados automaticamente quando o sistema recuperar." |
| **Capacity** | `result.message` exposto no AccessState | `result.message` pode vir de uma RPC error com detalhes internos ("capacity.slot.reserve failed: unique constraint violation"). Rui não precisa de saber de constraints. | "Capacidade operacional temporariamente indisponível. Tente novamente dentro de alguns minutos." |
| **Tariffs** | `result.message` exposto no AccessState | Mesmo problema — mensagens de erro de domínio expostas. | "Tarifário indisponível de momento. Se o problema persistir, contacte o suporte." |
| **Integrations** | `result.message` exposto no AccessState | Mesmo problema — erros de domínio/infra expostos. | "Integrações temporariamente indisponíveis. Tente novamente." |

### 3.3. Erros de linguagem (developer-facing)

| Página | Localização | Texto actual | Problema |
|--------|------------|--------------|----------|
| **Integrations** | Badge no card principal | `"Integration Gateway P13"` | Código interno exposto — deve ser "Integrações" ou "Gateway" |
| **Admin** | Card de contexto "Organização" | `ContextRow label="Tenant ID"` | "Tenant ID" é developer-facing — deve ser removido ou usar "ID da organização" |
| **Admin** | Card de contexto "Organização" | `ContextRow label="Slug"` | "Slug" é developer-facing — deve ser removido |
| **Tracking Detail** | Badge de permissão | `"Pode gerir"` / `"Somente leitura"` | Deve usar "autorizado" / "indisponivel" conforme AGENTS.md |
| **Tracking Detail** | Badge de permissão | `"Pode resolver"` / `"Resolucao bloqueada"` | Mesmo — usar "resolução autorizada" / "resolução indisponivel" |
| **Planning** | Tabela de ordens | `{order.cargoId}` exposto na tabela | ID interno exposto ao operador — irrelevante para Marta |
| **Capacity** | Tabela de slots | `{slot.id}` exposto na tabela | ID interno exposto ao operador |
| **OperationsSnapshot** | Estado de erro | `StatusTile` com "Leitura" "Nao autorizada" + "API: Erro" + "Fallback: Sem dados falsos" | Termos técnicos ("API", "Fallback") expostos ao utilizador |

### 3.4. Padrão a seguir

**Bom exemplo:** Planning usa `ErrorCard` com mensagem simples:

```tsx
<ErrorCard
  message="Nao foi possivel carregar os dados de planeamento. Tente novamente."
  title="Erro ao carregar planeamento"
/>
```

Este padrão deve ser **aplicado a todas as páginas**. As páginas Cargo, Tracking, Capacity, Tariffs e Integrations devem substituir a exposição de `error.message` / `result.message` por mensagens amigáveis.

---

## 4. Onboarding Recommendations

A plataforma não tem **qualquer onboarding** — nem modal de boas-vindas, nem tour guiado, nem checklist de primeiros passos. Para Carlos (que "se o sistema me disser o que fazer a seguir, eu faço"), isto é uma barreira enorme.

### Recomendação 1: Modal de boas-vindas com checklist de primeiros passos

**O quê:** Um modal que aparece na primeira vez que o utilizador acede ao Dashboard (controlado por `localStorage` ou perfil do utilizador).

**Conteúdo:**

```
╔══════════════════════════════════════════════════════╗
║  🚂 Bem-vindo ao SAPTM                              ║
║                                                      ║
║  Este é o seu centro de operações logísticas.        ║
║  Aqui gere cargas, tracking, planeamento e mais.     ║
║                                                      ║
║  Comece por:                                         ║
║                                                      ║
║  [ ] 1. Registar a sua primeira carga                ║
║       → Vá a "Cargas" e clique em "Registar carga"   ║
║                                                      ║
║  [ ] 2. Criar uma ordem de transporte                ║
║       → Vá a "Planeamento" e crie a primeira ordem   ║
║                                                      ║
║  [ ] 3. Explorar o Dashboard                         ║
║       → Veja os indicadores operacionais em tempo real║
║                                                      ║
║  [ ] 4. Convidar a sua equipa                        ║
║       → Vá a "Administração" e adicione colegas      ║
║                                                      ║
║  ┌──────────────────┐  ┌──────────────────────┐      ║
║  │ Começar agora    │  │  Não mostrar outra vez│      ║
║  └──────────────────┘  └──────────────────────┘      ║
╚══════════════════════════════════════════════════════╝
```

**Impacto:** Reduz o tempo de "first cargo registration" de minutos para segundos. Carlos sabe exactamente por onde começar.

### Recomendação 2: Badge de "Primeira visita" nos módulos

**O quê:** Nas primeiras 3 visitas a cada módulo, mostrar um badge "Novo" ou um tooltip指引 suave no topo.

**Exemplo na página Cargo (primeira vez):**

```
┌──────────────────────────────────────────┐
│ 🆕 Novo por aqui?                        │
│                                          │
│ O módulo Cargas permite registar,        │
│ libertar e acompanhar cargas.            │
│ Comece por clicar "Registar carga".      │
│                                          │
│ ┌──────┐                                │
│ │ Fechar │                              │
│ └──────┘                                │
└──────────────────────────────────────────┘
```

**Implementação:** Usar um estado no perfil do utilizador ou `localStorage` com contagem de visitas por página. Mostrar apenas nas primeiras 3 visitas.

**Impacto:** Marta (Planeadora) e Rui (Gestor) não precisam de adivinhar para que serve cada módulo.

### Recomendação 3: Empty states com CTAs que criam o primeiro recurso

**O quê:** Todos os empty states devem ter um CTA que **cria o primeiro recurso** da página. Não basta dizer que está vazio — é preciso levar o operador à acção.

**Tabela de CTAs obrigatórios:**

| Página | Empty state actual | CTA proposto |
|--------|-------------------|--------------|
| Cargo | "Nenhum dado encontrado..." | `[Registar primeira carga]` → abre dialog de registo |
| Tracking | "Nenhum dado encontrado..." | `[Planear primeiro transporte]` → navega para Planning |
| Planning | "Nenhuma ordem de transporte encontrada." | `[Criar primeira ordem]` → abre dialog de criação |
| Capacity | "Sem slots abertos..." | `[Abrir primeiro slot]` → abre dialog de abertura de slot |
| Tariffs | "Sem rate cards ativos..." | `[Criar primeiro rate card]` → abre dialog de registo |
| Integrations | "Nenhuma service account..." | `[Criar primeira conta de serviço]` → abre dialog de criação |
| Tracking Detail | "Nenhum evento operacional registado..." | `[Registar primeiro evento]` → abre dialog de evento |

**Impacto:** O operador nunca fica bloqueado num ecrã vazio. Cada página vazia é uma oportunidade de aprendizado.

---

## 5. Microlearning Opportunities

A plataforma não aproveita **momentos de aprendizado contextual**. O componente `Tooltip` existe em `@saptm/ui` mas **não é usado para ensinar**. Aqui estão 3 oportunidades de alto impacto.

### Oportunidade 1: Tooltips nos MetricTiles e ContextRows

**O quê:** Cada `MetricTile` e `ContextRow` deve ter um tooltip que explica o que o indicador significa em linguagem operacional.

**Onde (exemplos concretos):**

| Página | Indicador | Tooltip proposto |
|--------|-----------|------------------|
| Dashboard | "Módulos activos: 4/5" | "Módulos da plataforma a que tem acesso. Se faltar algum, contacte o gestor de operações." |
| Cargo | "Taxa de actividade: 73%" | "Percentagem de cargas em movimento (em trânsito ou em operação) face ao total registado." |
| Cargo | "Bloqueadas" | "Cargas retidas por documentação pendente, inspecção ou excepção de entrega. Precisa de acção." |
| Cargo | "Mercadorias perigosas" | "Cargas com classificação de risco (UN number, hazmat). Requerem manuseamento especial." |
| Tracking | "Atrasos: 3 (15%)" | "Percentagem de remessas com SLA excedido. Acima de 10% requer atenção do gestor de operações." |
| Planning | "Taxa de dispatch: 85%" | "Percentagem de ordens confirmadas que já foram despachadas. Ideal >90%." |
| Capacity | "Slot saturado" | "Slot com mais de 80% de ocupação. Considere abrir novos slots ou redistribuir reservas." |
| Tariffs | "Simulações calculadas" | "Número de simulações de custo geradas pendentes de aprovação financeira." |
| Integrations | "Eventos processados" | "Eventos externos (EDI, TOS, ERP) já processados com sucesso no sistema." |

**Implementação:** Adicionar `TooltipProvider` no layout e tooltips nos `MetricTile` e `ContextRow` que têm `label` — estender os componentes para aceitar `helpText` opcional:

```tsx
<MetricTile
  label="Bloqueadas"
  value="3"
  variant="destructive"
  help="Cargas retidas que precisam de acção — documentação, inspecção ou libertação."
/>
```

**Impacto:** Carlos percebe o que significa "73% taxa de actividade". Marta sabe se 85% dispatch é bom ou mau. Rui não precisa de adivinhar métricas.

### Oportunidade 2: Dica contextual nos formulários de registo

**O quê:** Em cada formulário (registar carga, criar ordem, abrir slot), adicionar uma dica curta (1 frase) que ensina o operador a preencher correctamente.

**Onde:**

| Formulário | Dica |
|------------|------|
| `Registar carga` | "💡 Precisa do conhecimento de carga e da classificação de risco (se aplicável)." |
| `Planear transporte` | "💡 Certifique-se que a carga está registada e que há capacidade disponível no terminal." |
| `Registar evento de tracking` | "💡 Indique a localização exacta e seleccione o tipo de evento (partida, chegada, atraso)." |
| `Abrir slot` | "💡 Defina a janela temporal e a capacidade máxima. Pode abrir slots para um turno inteiro." |
| `Criar service account` | "💡 A API key será gerada automaticamente. Guarde-a — não poderá vê-la novamente." |

**Implementação:** Usar o componente `Callout` (se existir) ou um `span` com `className="text-muted-foreground text-xs"` com ícone 💡 apenas quando apropriado.

**Impacto:** Carlos não precisa de perguntar ao supervisor o que preencher. O formulário ensina-o a fazer correctamente.

### Oportunidade 3: "Acção recomendada" nos context panels

**O quê:** O Tracking Detail já tem um `TrackingNextActionCard` que guia o operador. Este padrão deve ser replicado para outras páginas — um cartão que diz "O que fazer a seguir" baseado no contexto actual.

**Onde:**

| Página | Contexto | Acção recomendada |
|--------|----------|-------------------|
| **Dashboard** | Operador com 0 cargas | "Comece por registar a sua primeira carga." → link para Cargo |
| **Dashboard** | Operador com cargas mas sem tracking | "Active o tracking das suas remessas para acompanhar em tempo real." → link para Tracking |
| **Cargo** | Holds > 0 | "Tem {N} cargas bloqueadas. Precisa de verificar documentação." → highlight nas bloqueadas |
| **Cargo** | Inspecção pendente > 0 | "{N} cargas aguardam inspecção. Programe a vistoria." → link para compliance |
| **Planning** | Ordens sem capacidade | "{N} ordens sem reserva de capacidade. Associe slots para poder despachar." → link para Capacity |
| **Capacity** | Advisory com recomendação | "O motor de advisory recomenda abrir {N} slots. Reveja e decida." → highlight no advisory |
| **Tariffs** | Cotações calculadas sem aprovação | "{N} simulações aguardam aprovação. Reveja e aprove." → highlight nas cotações |

**Implementação:** Replicar o padrão `TrackingNextActionCard` para outros módulos. O cartão deve ser:
- Contextual (baseado em dados reais, não genérico)
- Accionável (link ou botão para a acção)
- Não intrusivo (pequeno cartão no topo ou sidebar)

**Impacto:** Rui (Gestor) vê logo o que precisa de atenção sem abrir 3 ecrãs. Carlos sabe o que fazer sem ligar ao supervisor.

---

## 6. Avaliação por Persona

### Carlos (Operador de Cargas) — 34 anos, baixa literacia técnica

**Maiores barreiras de aprendizagem:**
1. Empty states sem CTA — "Nenhuma carga" e depois? Carlos não sabe o próximo passo.
2. `error.message` exposto — se aparece "prisma error" ou "ECONNRESET", Carlos pensa que fez algo errado.
3. Zero onboarding — Carlos não sabe por onde começar nem o que cada módulo faz.
4. Sem tooltips — "Taxa de actividade 73%" significa o quê para o Carlos?
5. Badges "Pode gerir" / "Somente leitura" — Carlos não sabe o que são permissões.

**O que mais ajudaria Carlos:**
- Onboarding checklist (top prioridade)
- Empty states com CTA "Registar primeira carga"
- Tooltips em todos os MetricTiles com explicação simples
- Mensagens de erro amigáveis (nunca técnicas)

### Marta (Planeadora de Transportes) — 41 anos, literacia média

**Maiores barreiras de aprendizagem:**
1. Empty state do Planning sem CTA — Marta quer criar a primeira ordem, mas o ecrã só diz "Nenhuma ordem encontrada".
2. Formulários sem dicas contextuais — "Código de reserva", "UN number" sem explicação.
3. Falta de tooltips nos indicadores — "Taxa de dispatch 85%" é bom ou mau?

**O que mais ajudaria Marta:**
- CTAs nos empty states do Planning e Capacity
- Dicas nos formulários (microlearning #2)
- Tooltips com benchmarks (ex.: "Ideal >90%") (microlearning #1)

### Rui (Gestor de Operações) — 48 anos, literacia média-baixa

**Maiores barreiras de aprendizagem:**
1. Dashboard sem acções recomendadas — Rui quer saber o que precisa de atenção, mas o dashboard só mostra números.
2. Zero ajuda contextual — "Otimização assistida de capacidade" o que significa?
3. Admin com "Tenant ID" e "Slug" expostos — Rui não sabe o que é um tenant.

**O que mais ajudaria Rui:**
- Cartão "Acção recomendada" no Dashboard e Capacity (microlearning #3)
- Tooltips nos indicadores com significado de negócio
- Admin sem IDs técnicos expostos

---

## 7. Prioridade de Implementação

| Prioridade | Acção | Esforço | Impacto | Páginas |
|------------|-------|---------|---------|---------|
| **P0** | Substituir `error.message` exposto por mensagens amigáveis | 🟢 Baixo (2-3h) | 🔴 Crítico — Carlos vê erros técnicos e fica bloqueado | Cargo, Tracking, OperationsSnapshot, Capacity, Tariffs, Integrations |
| **P0** | Adicionar CTAs a todos os empty states | 🟢 Baixo (4h) | 🔴 Crítico — sem CTA o operador não sabe o que fazer | Todas (8 páginas) |
| **P0** | Remover IDs internos expostos (cargoId, tenantId, slotId, slug) | 🟢 Baixo (2h) | 🔴 Crítico — segurança + ruído visual | Planning, Capacity, Admin |
| **P1** | Tooltips nos MetricTiles e ContextRows | 🟡 Médio (8h) | 🟡 Alto — Carlos percebe as métricas | Todas (estender componente + adicionar helpText) |
| **P1** | Dicas contextuais nos formulários | 🟡 Médio (6h) | 🟡 Alto — reduz erros de preenchimento | Formulários de registo (cargo, planning, capacity, tariffs, integrations) |
| **P2** | Modal de onboarding com checklist | 🔴 Alto (16h) | 🔴 Crítico — novos operadores sem guia | Dashboard (primeira visita) |
| **P2** | Badge "Primeira visita" nos módulos | 🟡 Médio (8h) | 🟡 Alto — orienta navegação inicial | Todos os módulos |
| **P2** | Corrigir labels developer-facing (P13, "Pode gerir", "Tenant ID") | 🟢 Baixo (2h) | 🟡 Alto — linguagem operacional consistente | Integrations, Admin, Tracking Detail |
| **P3** | Cartões "Acção recomendada" nos módulos | 🔴 Alto (20h) | 🟡 Alto — guia o operador para o próximo passo | Dashboard, Cargo, Planning, Capacity, Tariffs |

### Nota sobre esforço vs impacto

As correcções **P0** são todas de baixo esforço (substituir mensagens de erro, adicionar CTAs, remover IDs) e têm **impacto crítico** na learnability. Recomenda-se implementação imediata.

As correcções **P1** (tooltips e dicas) são o coração do microlearning — transformam a plataforma de "sistema que mostra dados" para "sistema que ensina".

As correcções **P2** (onboarding) são o investimento mais pesado mas resolvem a maior falha de learnability: zero guia para novos operadores.

---

## Anexo: Checklist de Qualidade (Quality Gates)

Cada página foi avaliada contra os Quality Gates do Learning Design Department:

| Quality Gate | Dashboard | Cargo | Tracking | Planning | Capacity | Tariffs | Integrations | Admin | Tracking Detail |
|-------------|:---------:|:-----:|:--------:|:--------:|:--------:|:-------:|:-----------:|:-----:|:---------------:|
| Objetivo de aprendizagem definido (Bloom level) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Conteúdo testado com 3+ pessoas do target audience | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tempo de leitura adequado ao formato | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ | ✅ |
| Exemplos concretos e específicos | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ✅ |
| Chamadas à acção claras ("Agora faz X") | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Conceitos complexos têm analogia ou metáfora | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Métrica de eficácia definida | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Feedback incorporado | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legenda:** ✅ Cumpre | ⚠️ Parcial | ❌ Não cumpre

**Conclusão:** Nenhuma página cumpre todos os Quality Gates de Learning Design. As páginas mais próximas do padrão ideal são Planning (ErrorCard + try/catch + labels PT-PT) e Tracking Detail (NextActionCard + timeline navegável).

---

## Métricas de Aprendizagem (propostas)

Para medir a eficácia das correcções propostas:

| Métrica | Como medir | Linha de base | Objectivo (30 dias) |
|---------|-----------|---------------|---------------------|
| **Completion rate** de primeira acção | % de novos utilizadores que completam "registar primeira carga" no primeiro login | ~0% (sem onboarding) | >60% |
| **Tempo até primeira acção** | Minutos entre primeiro login e primeira acção útil | >10 min (estimado) | <3 min |
| **Taxa de erro em formulários** | % de submissões com erros de validação | Não medida | <15% |
| **NPS do conteúdo** | Survey após primeira semana | Não medida | >30 |
| **Knowledge retention** | Quiz de 5 perguntas após 7 dias | Não medida | >80% |
| **Aplicação prática (Kirkpatrick L3)** | % de utilizadores que usam 3+ módulos na primeira semana | Não medida | >70% |

---

*Documento criado pelo Departamento de Learning Design. Próxima revisão: 2026-07-30.*
