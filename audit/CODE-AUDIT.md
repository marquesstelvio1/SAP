# SAPTM — Auditoria de Código: Padrões shadcn/ui, Tokens e Stack

> **Data:** 2026-06-29
> **Stack:** Next.js 16 App Router, shadcn/ui (new-york), Tailwind v4, Radix, Zod v4, TanStack Query/Table, Better Auth

---

## Resumo para Decisão de Design

Antes de decidir o wireframe, é preciso saber o que está **realmente quebrado** no código e o que precisa de ser corrigido na arquitectura de componentes. Este relatório separa os problemas em:

| Camada | Status |
|--------|--------|
| **Tokens (CSS)** | ⚠️ P0 bugs — sombras não funcionam, tabelas quebradas |
| **Componentes shadcn/ui** | ✅ Base sólida, mas com inconsistências |
| **Padrões de formulário** | ⚠️ Duplicação massiva, mas padrão consistente |
| **Páginas de produto** | ❌ Linguagem dev, governance exposto, estados inconsistentes |
| **Arquitectura de ficheiros** | ⚠️ 1423-lines actions.ts, helpers duplicados |

---

## 1. TOKENS — Problemas Críticos (P0)

### 1.1 Sombras não funcionam — shadow-panel/overlay/command/sticky são dead code

**Ficheiro:** `packages/ui/src/styles/globals.css`

```css
:root {
  --shadow-panel: 0 1px 2px oklch(0.18 0.024 255 / 8%);
  --shadow-overlay: 0 18px 45px oklch(0.18 0.024 255 / 18%);
  /* ... */
}
```

Estas variáveis `--shadow-*` estão definidas em `:root` mas **NÃO estão mapeadas no `@theme inline {}`**. Portanto, classes Tailwind como `shadow-panel`, `shadow-overlay`, `shadow-command`, `shadow-sticky` **nunca são geradas**.

36+ componentes (`button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, etc.) usam estas classes — **todos sem sombra em runtime**.

**Impacto:** Cards, dialogs, dropdowns, popovers, sheets, toasts — tudo sem elevação visual.

**Fix:** 4 linhas no `@theme inline`:
```css
--shadow-panel: var(--shadow-panel);
--shadow-overlay: var(--shadow-overlay);
--shadow-command: var(--shadow-command);
--shadow-sticky: var(--shadow-sticky);
```

### 1.2 Tabelas com altura de linha quebrada

**Ficheiro:** `packages/ui/src/components/table.tsx`
```css
h-[var(--density-row-height)] /* undefined! */
```

O sistema de densidade define `--density-comfortable-row-height`, `--density-compact-row-height`, `--density-operational-row-height` mas **nunca** uma variável `--density-row-height` simples. Não há classe `.density-compact { --density-row-height: var(--density-compact-row-height); }`.

**Impacto:** Todos os `<TableHead>` têm `height: auto` em vez dos 3rem/2.5rem/2.25cm pretendidos.

### 1.3 Token gaps adicionais

| Token | Problema |
|-------|----------|
| `--tracking-heading` / `--tracking-label` | Definidos em `:root`, NÃO em `@theme` — ninguém usa |
| `--motion-duration-fast/normal/slow` | Definidos em `:root`, NÃO em `@theme` — componentes usam `duration-[var(--motion-duration-fast)]` |
| `--density-*-drawer-width` | Definidos só como fallback inline no drawer.tsx |
| `--font-numeric` | Duplicado de `--font-mono` |

---

## 2. PADRÕES DE COMPONENTES — shadcn/ui

### 2.1 O que está correcto ✅

| Padrão | Onde |
|--------|------|
| `data-slot` em todos os componentes UI | `field.tsx`, `table.tsx`, `card.tsx`, `timeline.tsx`, etc. |
| `cn()` para className merging | Todos os componentes |
| Compound components (composition > props) | `Field*`, `Card*`, `Table*`, `Sidebar*`, `Timeline*` |
| `data-disabled`, `data-invalid`, `data-orientation` para estado CSS | Forms e fields |
| HTML semântico | `<ol>`, `<li>`, `<table>`, `<fieldset>`, `<legend>` |
| Sidebar com density system | 3 densidades, cookie persistence, keyboard shortcut |
| Timeline component | 5 estados (completed/current/pending/error/warning) |
| `forwardRef` no ErrorCard | Acessibilidade |

### 2.2 O que está inconsistente ⚠️

| Problema | Localização | Impacto |
|----------|-------------|---------|
| `FieldContent` definido mas **nunca usado** | `field.tsx:65-73` | Código morto ou padrão abandonado |
| `AccessState` API inconsistente | Cargo usa `status`, Tracking usa `variant` | Duas APIs para o mesmo componente |
| `AccessState` tem 16 props | `access-state.tsx` | Design smell — componente faz demais |
| `Card` usa `style={{ padding }}` em vez de Tailwind | `card.tsx` | Inconsistência com resto da UI library |
| `ErrorCard` sem `data-slot` nem `cn()` | `error-card.tsx` | Quebra convenção |
| `MetricTile` sem `data-slot` | `metric-tile.tsx` | Quebra convenção |
| `h-12 w-12` em vez de `size-12` (Tailwind v4) | `access-state.tsx:62` | Estilo v3 |
| `EmptyState` usa `mb-1` em cima de `gap-3` | `empty-state.tsx:22` | Espacamento inconsistente |

### 2.3 Três modos de render do AccessState — confusão arquitectural

O componente `AccessState` faz três coisas diferentes:

1. **Inline badge** (quando `granted !== undefined`) — mostra badge verde/vermelho
2. **Card de erro** (quando `granted` é undefined) — card cheio com icon + título + descrição
3. **Variant mode** — usa `variant` prop para cor

Mas CargoOverviewClient usa `status` prop e TrackingOverviewClient usa `variant` prop. **Mesmo componente, props diferentes para o mesmo efeito visual.**

**Isto tem implicações directas no wireframe** — se queremos esconder governance cards, o AccessState em modo card precisa de ser repensado.

---

## 3. PADRÕES DE FORMULÁRIO — Duplicação Massiva

### 3.1 O padrão actual (todos os formulários seguem isto)

```
Client Component
├── "use client"
├── useActionState(action, initialState)
├── useState(idempotencyKey)
├── useMemo → createDatetimeLocalValue + addHours
├── useEffect → reset idempotencyKey on success
└── Render
    ├── Card
    │   ├── CardHeader → Badge(permission status) + Badge(permission name)
    │   └── form action
    │       ├── CardContent → FieldGroup
    │       │   ├── Field data-disabled={!canXxx}
    │       │   │   ├── FieldLabel
    │       │   │   ├── Input disabled={isDisabled}
    │       │   │   └── FieldError / FieldDescription
    │       └── CardFooter → Button submit + helper text
```

### 3.2 Código duplicado em TODOS os formulários

| O quê | Onde aparece | Quantas vezes |
|-------|-------------|---------------|
| `createIdempotencyKey(prefix)` | Cada form define a sua | 11+ |
| `createDatetimeLocalValue()` + `addHours()` | Cada form define as suas | 11+ |
| Badge(permission status) + Badge(permission name) | Cada form no CardHeader | 11+ |
| `useEffect` reset idempotencyKey | Cada form | 11+ |
| Fetch RPC pattern (validação → fetch → parse) | `cargo/actions.ts` | 12x |

### 3.3 Ações server-side — 1423 linhas de repetição

**Ficheiro:** `apps/web/app/(platform)/app/cargo/actions.ts`

Cada uma das 12 acções segue este padrão exacto:
```
1. requirePlatformSession
2. permission check
3. parse FormData
4. validation guard
5. get headers()
6. fetch POST /rpc/...
7. check 401/403
8. check !response.ok
9. safeParse response
10. revalidatePath + return
```

Isto repete-se **12 vezes** no mesmo ficheiro. Deveria ser:
```ts
async function callRpc<T>(endpoint, formData, schema, permission, session) {
  // todos os passos 1-10
}
```

---

## 4. ESTADOS — Inconsistentes entre Páginas

| Página | Loading | Error | Empty | Notas |
|--------|---------|-------|-------|-------|
| **Dashboard** | ❌ N/A (server) | ❌ N/A (server) | ❌ N/A | Mostra readiness checks, não KPIs |
| **Cargo** | ✅ `AccessState` | ✅ `AccessState` | ✅ `EmptyState` | Usa `status` prop |
| **Tracking** | ✅ Card inline | ✅ `AccessState` (3 separados) | ✅ `EmptyState` | Usa `variant` prop |
| **Planning** | ❌ **NÃO TEM** | ❌ **NÃO TEM** | ✅ inline text | Quebra se backend falhar |
| **Tracking detail** | ❌ N/A (server) | ✅ `AccessState` | ✅ inline text | ✅ |

**Problema fundamental:** Planning page é server component com `getPlanningOverview()` sem try/catch. Se o RPC falhar, a página dá erro 500.

---

## 5. LINGUAGEM E EXPOSIÇÃO — O Problema #1 para UX

### 5.1 Títulos das páginas (actuais vs. propostos)

| Rota | Actual | Devia ser |
|------|--------|-----------|
| `/app` | Foundation Control Center | Dashboard Operacional |
| `/app/cargo` | Registo governado de cargas | Cargas |
| `/app/tracking` | Tracking operacional de cargas | Tracking |
| `/app/planning` | Planeamento de transporte governado | Planeamento |
| `/app/capacity` | (similar) | Capacidade |

### 5.2 O que está exposto ao utilizador e devia estar invisível

| Informação | Onde | Porquê é problema |
|------------|------|-------------------|
| Permission names (`cargo.read`, `tracking.shipment.read`) | Em badges e ContextRows em TODAS as páginas | O operador não sabe nem precisa de saber o nome interno das permissões |
| RPC endpoints (`POST /rpc/cargo/register`) | Em ContextRows em todas as páginas | Detalhe de implementação |
| Session IDs | Nos governance cards | Risco de segurança informacional |
| Organization IDs | Nos governance cards | O operador não precisa de ver IDs internos |
| "Sem CRUD", "Leitura governada" | Em badges e descrições | Linguagem de arquitecto, não de operador |
| Status de permissão ("Pode registar" / "Somente leitura") | Em badges em cada secção | Poluição visual — o RBAC já bloqueia o que não pode ser feito |

---

## 6. ARQUITECTURA DE FICHEIROS — Proposta de Evolução

### 6.1 Actual (disperso)

```
apps/web/
  components/cargo/cargo-register-form.tsx    # define createIdempotencyKey internamente
  components/tracking/tracking-event-record-form.tsx  # redefine createIdempotencyKey
  app/(platform)/app/cargo/actions.ts        # 1423-lines, 12x fetch pattern
  app/(platform)/app/planning/page.tsx       # define formatOperationalDate inline
```

### 6.2 Proposta (consolidado)

```
packages/ui/src/
  hooks/use-idempotency.ts          # useIdempotency(prefix) hook
  hooks/use-form-action.ts          # wrapper para useActionState + toast + reset
  utils/format.ts                   # formatOperationalDate, createDatetimeLocalValue, addHours
  components/
    form-permission-indicator.tsx   # Badge pair (permission status + name)
    form-action-footer.tsx          # CardFooter padrão com helper text + submit button

apps/web/
  app/(platform)/app/cargo/actions.ts  # reduzido com callRpc() helper partilhado
```

---

## 7. O QUE ISTO SIGNIFICA PARA O WIREFRAME

### O wireframe Operacional-first (Opção A) é viável AGORA porque:

1. **Os componentes shadcn/ui existem** — Card, Table, Badge, MetricTile, EmptyState, Field, Button estão todos no `@saptm/ui`
2. **O layout shell está pronto** — SidebarProvider + SidebarInset + header sticky com breadcrumbs
3. **O sistema de tokens está definido** — só precisa de 4 linhas para sombras + 3 para density + 3 para motion
4. **O padrão de formulário é consistente** — apesar da duplicação, todos seguem a mesma estrutura
5. **O permission gating está sólido** — server-side enforcement + client-side visual

### O que PRECISA de ser corrigido antes do wireframe final:

| Ordem | O quê | Esforço | Depende de |
|-------|-------|---------|------------|
| 1 | Fix shadow tokens no `@theme` | 4 linhas | Nada |
| 2 | Fix `--density-row-height` | 3 linhas + 1 componente | Nada |
| 3 | Extrair `callRpc()` helper | 1 ficheiro novo + refactor actions.ts | Nada |
| 4 | Extrair `useIdempotency()` hook | 1 ficheiro novo | Nada |
| 5 | Unificar API do `AccessState` | 1 componente | Decisão de design |
| 6 | Remover governance cards | 5 páginas | Decisão de wireframe |
| 7 | Substituir linguagem dev | 5 páginas + componentes | Decisão de wireframe |

**Itens 6 e 7 dependem da decisão de wireframe que está a considerar.** Os itens 1-5 são independentes e podem ser feitos já.

---

*Fim da auditoria de código.*
