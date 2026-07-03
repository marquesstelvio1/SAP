# Auditoria UX/UI — Nível Empresarial

**Data:** 2026-07-03
**Âmbito:** Todas as páginas UI da plataforma SAPTM
**Padrão:** Stripe / Linear / Vercel — shadcn/ui new-york style
**Resultado:** ❌ REJEITADO — 4 bloqueadores, 8 críticos, 24 melhorias

---

## Scorecard

| Dimensão | Pontuação | Estado |
|----------|-----------|--------|
| Layout & Grid | 4/10 | ⚠️ 5+ padrões de grid diferentes, containers inconsistentes |
| Hierarquia Visual | 5/10 | ⚠️ Sem escala tipográfica definida, headings arbitrários |
| Consistência | 3/10 | ❌ `space-y` vs `flex-col gap`, 3 tipos de container, 5 fraction patterns |
| Linguagem Operacional | 5/10 | ⚠️ Texto developer-facing exposto, acentos em falta |
| Acessibilidade | 5/10 | ⚠️ `fieldset contents` quebra semântica, z-index hardcoded |
| Densidade Cognitiva | 4/10 | ⚠️ Admin com 6+ forms, Integrations com 7 colunas |
| Micro-Interações | 2/10 | ❌ Zero animações, zero shortcuts operacionais |
| Design Tokens | 4/10 | ⚠️ Tokens de densidade existem mas não são usados |
| **Global** | **4.0/10** | 🟠 **Necessita redesign** |

---

## Bloqueadores (P0)

### 1. Breadcrumb com texto developer-facing
- **Ficheiro:** `apps/web/components/shell/breadcrumb-nav.tsx:22`
- **Problema:** `"UI/Auth/App Shell Foundation"` exposto como fallback do breadcrumb
- **Impacto:** Utilizador vê jargão de arquitectura interna
- **Correcção:** Usar `"Plataforma SAPTM"` ou mapeamento por domínio

### 2. Audit page usa `<details>`/`<summary>` nativo
- **Ficheiro:** `apps/web/app/(platform)/app/audit/page.tsx:375`
- **Problema:** HTML nativo sem estilos, animação ou acessibilidade garantida
- **Impacto:** Quebra consistência visual, sem dark mode support
- **Correcção:** Substituir por `Collapsible` do shadcn/ui

### 3. Integrations grid 7 colunas
- **Ficheiro:** `apps/web/app/(platform)/app/integrations/page.tsx:130`
- **Problema:** `2xl:grid-cols-7` coloca 7 formulários lado a lado
- **Impacto:** Completamente inutilizável em ecrã wide, cada form precisa de min-width
- **Correcção:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` no máximo

### 4. Admin com 6+ formulários
- **Ficheiro:** `apps/web/app/(platform)/app/admin/page.tsx:116-189`
- **Problema:** Convida user, cria roles, atualiza permissões, apaga roles, regista recursos de capacidade
- **Impacto:** Sobrecarga cognitiva severa — não há progressão, tudo compete
- **Correcção:** Separar em tabs ou páginas: "Utilizadores" | "Perfis" | "Capacidade"

---

## Críticos (P1)

### Containers Inconsistentes
- **Ficheiro:** Múltiplos
- **Problema:** `<main>` (tariffs, notifications, security, privacy) vs `<div>` (resto)
- **Correcção:** Unificar para `<div className="mx-auto flex max-w-7xl flex-col gap-6">`

### Grid Fractions (5 padrões diferentes)
- `[1.2fr_0.8fr]`, `[1.25fr_0.75fr]`, `[1.1fr_0.9fr]`, `[1.15fr_0.85fr]`, `[0.85fr_1.15fr]`
- **Correcção:** Reduzir a 2 padrões: `[1.2fr_0.8fr]` (conteúdo primário) e `[1fr_1fr]` (igual)

### Hardcoded z-index
- **Ficheiro:** `apps/web/app/layout.tsx:71`
- **Problema:** `z-[9999]` em skip link
- **Correcção:** `z-[var(--z-command)]` ou token existente

### Sign-in gradient hardcoded
- **Ficheiro:** `apps/web/app/sign-in/page.tsx:29`
- **Problema:** `bg-[radial-gradient(ellipse_at_top,...)]` — quebra em dark mode
- **Correcção:** Usar variáveis CSS ou gradiente temático

### Inline SVGs no OrganizationSwitcher
- **Ficheiro:** `components/shell/organization-switcher.tsx:106-117`
- **Problema:** `<svg>` nativo em vez de `ChevronDownIcon` / `CheckIcon` do lucide-react

### Acentos em falta (PT-PT)
- **Ocorrências:** ~30 em toda a app
- **Palavras:** `organizacao`, `notificacoes`, `acoes`, `excecoes`, `auditavel`, `filtravel`, `facturacao`
- **Correcção:** Adicionar acentos a todas (`ção`, `ções`)

### Hardcoded shortcut keys sem listeners
- **Ficheiro:** `components/app-sidebar/nav-user.tsx:109-149`
- **Problema:** `⇧⌘P`, `⌘B`, `⌘S`, `⌘Q` mostrados mas sem event listeners
- **Correcção:** Implementar listeners ou remover labels

---

## Melhorias (P2)

| # | Ficheiro | Problema | Correcção |
|---|----------|----------|-----------|
| 1 | Múltiplos | `space-y-*` vs `flex-col gap-*` | Unificar para `flex-col gap-*` |
| 2 | `layout.tsx:44` | `themeColor: "#ffffff"` hardcoded | Usar CSS variable |
| 3 | `tracking/page.tsx:66-100` | 3 error blocks repetidos | Consolidar 1 bloco |
| 4 | `admin/page.tsx:181-186` | `CapacityResourceRegisterForm` no Admin | Mover para Capacidade |
| 5 | `settings/billing/page.tsx:142` | Comentários HTML em produção | Remover |
| 6 | Múltiplos | `bg-muted/20`, `bg-muted/30` opacidades | Criar tokens `--bg-subtle`, `--bg-muted` |
| 7 | `layout.tsx:73` | `"Saltar para o conteudo"` sem acento | `"Saltar para o conteúdo"` |
| 8 | `audit/page.tsx:375` | Native details/summary | Collapsible shadcn |
| 9 | `tariffs/page.tsx:87` | `max-w-7xl` sem `mx-auto` | Adicionar `mx-auto` |
| 10 | `notifications/page.tsx:177-183` | Empty state hardcoded | Componente `EmptyState` |

---

## Especificação de Design System

### Grid Pattern Único
```tsx
// TODAS as páginas devem usar:
<div className="mx-auto flex max-w-7xl flex-col gap-6">
```

### Heading Hierarchy
```
h1: text-3xl font-semibold tracking-heading  (page titles)
h2: text-xl font-semibold tracking-heading   (section titles)
h3: text-base font-semibold                   (card titles)
```

### Grid Fractions Permitidos
```tsx
// Conteúdo primário + sidebar
xl:grid-cols-[1.2fr_0.8fr]
// Igual
xl:grid-cols-2
// 3 colunas iguais
xl:grid-cols-3
```

### Tokens Obrigatórios
- `--density-row-height` para linhas de tabela
- `--density-compact-control-height` para inputs/buttons
- `--z-command` para overlays
- `--shadow-panel` para cards
- `--tracking-heading` para headings

### Linguagem Operacional (Regras)
- ✅ `"Cargas"`, `"Tracking"`, `"Capacidade"` — operacional
- ✅ `"Registo autorizado"`, `"Registo indisponivel"` — badges
- ❌ `"API"`, `"RBAC"`, `"CRUD"`, `"sessionId"`, `"organizationId"` — proibido
- ❌ `"UI/Auth/App Shell Foundation"` — proibido
- ❌ Nomes de permissões (`cargo.register`, `tracking.shipment.read`) — proibido

---

## Próximos Passos

1. Aplicar correcções P0 (bloqueadores)
2. Unificar padrão de container em todas as páginas
3. Corrigir acentos PT-PT em toda a app
4. Implementar tokens de densidade em tabelas e formulários
5. Separar Admin em tabs (Utilizadores | Perfis | Capacidade)
6. Adicionar transições de página (framer-motion ou CSS view transitions)
7. Auditoria final de acessibilidade (axe-core)
