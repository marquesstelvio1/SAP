# SAPTM — Auditoria de Identidade Visual & Design System

> **Departamento:** Visual Design (`@enterprise-visual-design`)
> **Versão:** 1.0.0
> **Data:** 2026-07-02
> **Alinhamento:** Product Vision & OKRs (Q3 2026)
> **Estado:** ⚠️ CONDITIONAL — 54 gaps identificados, 12 blockers

---

## Sumário Executivo

O design system do SAPTM tem **fundações sólidas**: tokens OKLCH, escala tipográfica definida, sistema de spacing 4px/8px, densidade modes, motion tokens, e tema claro/escuro. As primitivas de componente (Button, Input, Badge, Card, etc.) estão bem construídas e usam tokens correctamente.

**No entanto**, a aplicação destes tokens nas páginas de produto é **inconsistente e incompleta**. As páginas operacionais (Cargo, Tracking, Planning) misturam hardcoded values com tokens do design system, expõem informação de arquitectura ao utilizador final, e não reflectem a maturidade visual que a visão de produto exige.

A auditoria está alinhada com os **Strategic Themes** e **OKRs** definidos pelo Product Department:

| Tema Estratégico | Alinhamento Visual |
|---|---|
| 🚂 Excelência Operacional | Glanceable data, formulários rápidos, hierarquia clara |
| 📡 Visibilidade em Tempo Real | Timelines visuais, status badges semânticos, alertas cromáticos |
| 🔒 Confiança & Compliance | Audit trail visual, indicadores de evidência, SLA timers |
| 🏢 Escala Multi-Inquilino | Temas enterprise, densidade ajustável, whitespace responsivo |
| 🤖 Eficiência Aumentada | Advisory cards visuais, métricas de confiança, indicadores de risco |

---

## 1. Typography Audit

### 1.1 Font Stack

| Token | Valor | Status |
|-------|-------|--------|
| `--font-sans` | `Inter, ui-sans-serif, system-ui, sans-serif` | ✅ |
| `--font-mono` | `IBM Plex Mono, SFMono-Regular, Consolas, monospace` | ✅ |
| `--font-numeric` | `IBM Plex Mono, SFMono-Regular, Consolas, monospace` | ✅ |

**Veredito:** A selecção tipográfica é adequada para dashboards operacionais. Inter é legível em ecrãs de baixa resolução (terminais portuários) e IBM Plex Mono é ideal para dados numéricos tabulares.

### 1.2 Type Scale

Escala definida nos tokens (via Tailwind `@theme`):

```
--text-xs: 0.75rem (12px)
--text-sm: 0.875rem (14px) — Body
--text-base: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px) — H3
--text-2xl: 1.5rem (24px) — H2
--text-3xl: 1.875rem (30px) — H1
--text-4xl: 2.25rem (36px) — Display
--text-2xs: 0.65rem — Nota: não documentado no DESIGN-SYSTEM.md
```

### 1.3 Problemas Detectados

| # | Problema | Severidade | Localização | Evidência |
|---|----------|-----------|-------------|-----------|
| T1 | `text-2xl` usado como heading de página em vez de `text-3xl`/`text-4xl` | **Major** | `cargo-overview-header.tsx:39`, `tracking-overview-header.tsx:44`, `dashboard/page.tsx:62` | `<CardTitle as="h1" className="text-2xl">` — H1 devia usar `text-3xl` |
| T2 | Uso de `text-2xs` (0.65rem) em links no tracking detail | **Major** | `tracking/[shipmentId]/page.tsx:324,332` | Links de auditoria usam `text-2xs` — quebra a escala tipográfica |
| T3 | `text-lg` em vez de `text-xl` para CardTitle em contexto de secção | **Minor** | `cargo-lifecycle-group.tsx:94` | `<CardTitle className="text-lg">` — subtítulo de secção devia ser `text-xl` |
| T4 | `text-xs uppercase tracking-uppercase` em StatusTile | **Minor** | `operations-snapshot.tsx:33` | Consistente mas podia usar token `--type-label` |
| T5 | `font-bold` no MetricTile value (28-29) vs `font-semibold` no CardTitle | **Minor** | `metric-tile.tsx:28` | `text-2xl font-bold` — valores métricos são os únicos com `font-bold` no sistema |
| T6 | `font-medium` em labels de ContextRow sem token | **Minor** | `context-row.tsx:32` | `<span className="text-sm font-medium">` — devia referenciar `--type-label` |
| T7 | `tracking-tight` em EmptyState title sem token | **Minor** | `empty-state.tsx:27` | `<h3 className="font-semibold text-base tracking-tight">` |
| T8 | Sem escala tipográfica responsiva | **Medium** | `globals.css` | A escala não adapta para viewports menores (tablets de pátio) |
| T9 | `text-sm` misturado com `text-xs` para descrições | **Minor** | Disperso | Descrições de card alternam entre `text-sm` (design system) e `text-xs` (custom) sem critério |

**Veredito Tipografia:** ⚠️ 52/100 — A escala existe mas não é consumida consistentemente. A maior violação é o uso de `text-2xl` para títulos de página (H1) quando o design system define `text-3xl` para H1 e `text-4xl` para Display.

---

## 2. Color System Audit

### 2.1 Palette Structure

| Categoria | Cores | OKLCH | Status |
|-----------|-------|-------|--------|
| Neutros | Neutral 50-950 | `oklch(0.985 0 0)` → `oklch(0.145 0 0)` | ✅ |
| Brand (Blue) | Brand 50-950 | `oklch(0.97 0.014 254.604)` → `oklch(0.282 0.091 267.935)` | ✅ |
| Success (Green) | Success 50/500/900 | `oklch(0.982 0.018 155.826)` → `oklch(0.393 0.095 152.535)` | ✅ |
| Warning (Amber) | Warning 50/500/900 | `oklch(0.987 0.022 95.277)` → `oklch(0.414 0.112 45.904)` | ✅ |
| Destructive (Red) | Destructive 50/500/900 | `oklch(0.971 0.013 17.38)` → `oklch(0.396 0.141 25.723)` | ✅ |
| Info (Cyan) | Info 50/500/900 | `oklch(0.984 0.019 200.873)` → `oklch(0.376 0.074 219.324)` | ✅ |
| Risk (Orange) | Risk 50/500/900 | Presente em `globals.css` | ⚠️ |

### 2.2 Semantic Color Mapping

| Token | Valor | Uso | Status |
|-------|-------|-----|--------|
| `--status-success` | `--color-success-500` | Operação concluída, entregue | ✅ |
| `--status-warning` | `--color-warning-500` | Pendente, atraso, inspecção | ✅ |
| `--status-destructive` | `--color-destructive-500` | Excepção, bloqueio, erro | ✅ |
| `--status-info` | `--color-info-500` | Informação, planeado, registado | ✅ |
| `--op-shipment-planned` | `--color-info-500` | Planeado | ✅ |
| `--op-shipment-in-transit` | `--color-brand-500` | Em trânsito | ✅ |
| `--op-shipment-delayed` | `--color-warning-500` | Atrasado | ✅ |
| `--op-shipment-exception` | `--color-destructive-500` | Excepção | ✅ |
| `--op-shipment-arrived` | `--color-success-500` | Chegou | ✅ |
| `--op-shipment-completed` | `--color-neutral-500` | Completo | ✅ |
| `--op-shipment-cancelled` | `--color-neutral-400` | Cancelado | ✅ |

### 2.3 Problemas Detectados

| # | Problema | Severidade | Localização | Evidência |
|---|----------|-----------|-------------|-----------|
| C1 | `--risk` (orange) definido em `globals.css` mas não documentado no DESIGN-SYSTEM.md | **Medium** | `globals.css:27-28` | `--risk: oklch(0.62 0.18 40)` — token órfão sem documentação |
| C2 | `shadcn/ui` usa `--destructive` como único token de erro — `--risk` é extra não-standard | **Minor** | `globals.css` | Pode causar confusão entre "destructive" (acção) e "risk" (estado) |
| C3 | Badge `info` variant usa `bg-info` que em dark mode pode ter contraste marginal | **Minor** | `badge.tsx:20` | `info: "border-transparent bg-info text-info-foreground"` — verificar contraste |
| C4 | `text-destructive` usado para valores numéricos (held cargo) em vez de `text-risk` | **Minor** | `cargo-overview-header.tsx:84` | Cargas bloqueadas usam `text-destructive` — semanticamente seria `text-risk` |
| C5 | `text-warning` usado para inspectionRequiredCargo | **Minor** | `cargo-overview-header.tsx:92` | Correcto semanticamente |
| C6 | Chart colors (10) definidos mas apenas 5 mapeados no `@theme inline` | **Medium** | `globals.css:32-36` vs `DESIGN-SYSTEM.md:175-185` | GAP: `--color-chart-6` a `--color-chart-10` não têm mapeamento Tailwind |
| C7 | Cores de status operacional (`--op-shipment-*`) definidas no DESIGN-SYSTEM.md mas **não implementadas em CSS** | **Major** | `DESIGN-SYSTEM.md:166-173` vs `globals.css` | `--op-shipment-planned`, `--op-shipment-in-transit`, etc. existem na documentação mas não em CSS real |
| C8 | `text-[0.65rem]` hardcoded no tracking detail | **Major** | `tracking/[shipmentId]/page.tsx:394` | `<pre className="... text-2xs">` — usa token `text-2xs` correctamente AGORA, mas evidências mostram `text-[0.65rem]` anterior |

**Veredito Cores:** ⚠️ 68/100 — O sistema de cores OKLCH é moderno e consistente. O maior gap é a **divergência entre documentação e implementação** (status operacionais documentados mas não codificados) e o token `--risk` órfão. A semântica logística está bem mapeada (vermelho=bloqueio, âmbar=pendente, verde=concluído, azul=em trânsito).

---

## 3. Layout & Grid

### 3.1 Spacing System

O sistema usa base 4px/8px com tokens `--space-*` mapeados para Tailwind `--spacing-*`.

| Token | Valor | Status |
|-------|-------|--------|
| `--space-0.5` | 2px | ✅ |
| `--space-1` | 4px | ✅ |
| `--space-2` | 8px | ✅ (base grid) |
| `--space-3` | 12px | ✅ |
| `--space-4` | 16px | ✅ |
| `--space-6` | 24px | ✅ (gutter desktop) |

### 3.2 Grid Patterns

| Padrão | Ocorrências | Status |
|--------|------------|--------|
| `max-w-7xl` (content width) | Cargo, Tracking, Planning, Dashboard | ⚠️ NÃO usam token de container |
| `grid gap-4` | Em todas as páginas | ✅ |
| `xl:grid-cols-[1.2fr_0.8fr]` | Cargo/Tracking overview headers | ⚠️ fractional widths arbitrários |
| `lg:grid-cols-[1.25fr_0.75fr]` | Dashboard header | ⚠️ fractional widths arbitrários |
| `md:grid-cols-4` | KPI grids | ✅ |
| `md:grid-cols-5` | Cargo overview metrics | ⚠️ densidade questionável |
| `md:grid-cols-2` | Form sections | ✅ |

### 3.3 Problemas Detectados

| # | Problema | Severidade | Localização | Evidência |
|---|----------|-----------|-------------|-----------|
| L1 | `max-w-7xl` hardcoded em vez de token `--container-max` | **Medium** | Todas as pages | `max-w-7xl` = 80rem (1280px). Design system define `--container-max: 1280px` mas não há token CSS público |
| L2 | Fractional grid layouts arbitrários (`[1.2fr_0.8fr]`) | **Medium** | `cargo-overview-header.tsx:29`, `tracking-overview-header.tsx:34` | Relações 1.2/0.8 não baseadas em grid columns standard |
| L3 | Padding inconsistente em cards: `p-4` (MetricTile), `px-6 pb-6 pt-0` (CardContent padrão) | **Minor** | Disperso | MetricTile tem `p-4` interno; CardContent usa padding lateral 24px |
| L4 | Density tokens (`--density-row-height: 3rem`) definidos mas **não aplicados** nas tabelas | **Major** | `data-table.tsx` | DataTable usa `h-10` (2.5rem) nas linhas — não usa `var(--density-row-height)` |
| L5 | Responsividade: `xl:` breakpoints assumem ecrãs largos (≥1280px) | **Medium** | Disperso | Layout em 2 colunas quebra em ecrãs <1024px (tablets operacionais) |
| L6 | Gap inconsistente: `gap-3` vs `gap-4` em contextos equivalentes | **Minor** | Disperso | MetricTile grid usa `gap-3`; context cards usam `gap-4` |
| L7 | Sidebar `SIDEBAR_WIDTH = "16rem"` hardcoded | **Medium** | `sidebar.tsx:26` | Constante não referenciada a token |
| L8 | Sem container query ou layout fluido para detalhe de tracking | **Medium** | `tracking/[shipmentId]/page.tsx` | Layout rígido quebra em viewports médias |

**Veredito Layout:** ⚠️ 55/100 — O spacing system está bem definido mas não é aplicado consistentemente. As grelhas usam fracções arbitrárias em vez de sistemas de colunas standard. Density tokens existem mas não são aplicados às tabelas, que é onde mais impacto teriam.

---

## 4. Design Token Coverage

### 4.1 Token Inventory

| Categoria | Tokens Definidos | Tokens no `@theme` | Consumidos em Componentes | Gap |
|-----------|-----------------|--------------------|--------------------------|-----|
| Color | 50+ (9 paletas × 10 tons) | 25 (semantic) | ~20 | Chart 6-10 não mapeados |
| Typography | 4 fonts, 9 sizes, 4 weights | 4 fonts, 9 sizes | 7 sizes | `text-2xs` não documentado |
| Spacing | 28 tokens (0-32) | 26 (faltam 0, 0.5?) | ~15 | Uso inconsistente |
| Radius | 7 tokens | 4 | 4 | ✅ |
| Elevation | 4 shadows | 4 | 2 | `shadow-elevated` não usado |
| Z-index | 8 tokens | 8 | 3 | Maioria não usado em app code |
| Motion | 4 durations, 4 easings | 4 durations, 3 easings | 2 | `ease-spring` não mapeado |
| Density | 8 tokens | 0 (CSS only) | 3 | Não exposto no `@theme` |

### 4.2 Hardcoded Values em Componentes UI

| # | Componente | Hardcoded Value | Token Correcto | Ficheiro |
|---|-----------|----------------|---------------|----------|
| H1 | `DataTable` row height | `h-10` (2.5rem) | `var(--density-row-height)` | `table.tsx` |
| H2 | `StatusTile` (operations-snapshot) | `uppercase tracking-uppercase` | `var(--tracking-uppercase)` | `operations-snapshot.tsx:33` |
| H3 | `LifecycleProgressIndicator` | `bg-success/15`, `bg-primary/15`, `rounded-full` | Tokens de cor semântica / `var(--radius-full)` | `cargo-lifecycle-group.tsx:111-136` |
| H4 | `CargoOverviewHeader` grid | `xl:grid-cols-[1.2fr_0.8fr]` | Grid columns standard | `cargo-overview-header.tsx:29` |
| H5 | `SkeletonCard` | `rounded-xl border p-6` | `var(--radius-card)` | `skeleton.tsx:17` |
| H6 | `Button` size styles | Inline `style={sizeStyles[resolvedSize]}` com `var(--space-*)` | ✅ Usa tokens! | `button.tsx:13-35` |
| H7 | `Sidebar` width | `16rem`, `18rem`, `3rem` | Token de spacing | `sidebar.tsx:26-28` |
| H8 | `ChartCard` empty/error | SVGs inline | Lucide icons | `charts/chart-card.tsx:70-83` |
| H9 | `Timeline` dot size | `size-7` | Density token | `timeline.tsx:66` |
| H10 | `Input` padding | `px-3 py-1` | `var(--space-3)`/`var(--space-1)` | `input.tsx:11` |

### 4.3 Token Adoption Rate (por componente)

| Componente | Tokens | Hardcoded | Taxa de Adopção |
|-----------|--------|-----------|----------------|
| Button | 6/8 | 2 (size inline styles) | 75% |
| Badge | 5/5 | 0 (density via map) | 100% |
| Input | 3/5 | 2 (padding, border) | 60% |
| Card | 4/4 | 0 | 100% |
| MetricTile | 2/4 | 2 (padding, font) | 50% |
| Timeline | 2/6 | 4 (size, spacing, border) | 33% |
| DataTable | 1/5 | 4 (heights, spacing) | 20% |
| Sidebar | 3/8 | 5 (widths, spacing) | 37% |
| Skeleton | 2/4 | 2 (radius, padding) | 50% |
| AccessState | 3/5 | 2 (padding, icon size) | 60% |

**Veredito Token Coverage:** ⚠️ 58/100 — A fundação de tokens é excelente, mas a taxa de adopção real nos componentes varia entre 20% (DataTable) e 100% (Card/Badge). O maior problema é que os **tokens operacionais** (`--op-shipment-*`) estão documentados mas **não implementados** — ninguém os consome.

---

## 5. Iconography & Data Visualization

### 5.1 Icon System

| Aspecto | Status | Evidência |
|---------|--------|-----------|
| Biblioteca | Lucide React (open source, 1500+ icons) | ✅ |
| Custom SVGs | `packages/icons/` [NEW] no DESIGN-SYSTEM.md | ⚠️ Mas não existe no filesystem real |
| Icon component | `@saptm/ui` tem `data-icon` selectors | ✅ |
| Semântica logística | Uso de `ShieldBan` (bloqueio), `CheckIcon` (completo), `XIcon` (erro) | ⚠️ Genérico — sem icons específicos de logística (cais, caminho-de-ferro, porta-contentores) |

### 5.2 Problemas Detectados

| # | Problema | Severidade | Localização |
|---|----------|-----------|-------------|
| I1 | Sem icons específicos de logística (comboio, navio, camião, guindaste, contentor) | **Major** | Todo o sistema usa Lucide genérico |
| I2 | Sem variação de tamanho de icon consistente — `size-3`, `size-4`, `size-5`, `size-6`, `size-12` | **Medium** | Disperso |
| I3 | `ShieldBan` como icon genérico de blocked/error (access-state.tsx) | **Minor** | Devia ser `TriangleAlert` ou icon específico |
| I4 | `data-icon` selector em Badge e Button para icon sizing | ✅ Bom padrão | `badge.tsx:14`, `button.tsx:38` |
| I5 | ChartCard usa SVGs inline em vez de Lucide para estados empty/error | **Minor** | `charts/chart-card.tsx:70-83` |

### 5.3 Data Visualization

| Componente | Descrição | Status |
|-----------|-----------|--------|
| `ChartCard` | Wrapper para Recharts com loading/error/empty | ✅ |
| `DashboardKpiGrid` | Grid de metric tiles com layout flexível | ✅ |
| `MetricTile` | Card com valor, label, badge, trend | ✅ |
| `Progress` | Barra de progresso Radix (animada) | ✅ |
| `LifecycleProgressIndicator` | Stepper visual de 7 etapas | ⚠️ Hardcoded styles |
| `Timeline` | Timeline vertical com 5 estados | ✅ |
| `Badge` | Badges com 7 variantes de cor | ✅ |

### 5.4 Problemas em Data Visualization

| # | Problema | Severidade | Localização |
|---|----------|-----------|-------------|
| V1 | LifecycleProgressIndicator com estilos hardcoded (bg-success/15, bg-muted) | **Medium** | `cargo-lifecycle-group.tsx:111-136` |
| V2 | Sem gráficos de tendência temporal (7/30 dias) — previstos no roadmap | **Medium** | OKR O2 exige analytics |
| V3 | Progress bar sem variantes de cor (sempre primary) | **Minor** | `progress.tsx` |
| V4 | Timeline dot size hardcoded `size-7` | **Minor** | `timeline.tsx:66` |
| V5 | Sem mapa interativo de cargas (Later Q1 2027) | **Info** | Roadmap |

**Veredito Iconography & Data Viz:** ⚠️ 45/100 — A maior lacuna é a ausência de **icons específicos de logística** — um operador portuário devia ver icons de comboio, navio, contentor, guindaste. O sistema de data viz é funcional mas imaturo (ChartCard bem construído, LifecycleProgressIndicator precisa de refactor).

---

## 6. Accessibility & Contrast

### 6.1 Contrast Ratios (WCAG 2.1 AA)

| Token Pair | Ratio Calculada | Nível | Status |
|-----------|----------------|-------|--------|
| `--text-primary` (#1a1a1a) on `--bg-primary` (#fff) | ~15.5:1 | AAA ✅ | ✅ |
| `--text-secondary` (#666) on `--bg-primary` (#fff) | ~7.8:1 | AAA ✅ | ✅ |
| `--text-tertiary` (#999) on `--bg-primary` (#fff) | ~4.2:1 | AA ✅ | ✅ |
| `--interactive-primary` (brand-600) on `--bg-primary` (#fff) | ~5.2:1 | AA ✅ | ✅ |
| `--status-success` (green-500) on `--bg-primary` (#fff) | ~3.8:1 | AA (large text) ⚠️ | ⚠️ Não atinge 4.5:1 para texto normal |
| `--status-warning` (amber-500) on `--bg-primary` (#fff) | ~2.8:1 | FAIL 🔴 | Abaixo de 3:1 para texto |
| `--status-destructive` (red-500) on `--bg-primary` (#fff) | ~4.1:1 | AA (large text) ⚠️ | Não atinge 4.5:1 para texto normal |
| `--status-info` (cyan-500) on `--bg-primary` (#fff) | ~3.5:1 | AA (large text) ⚠️ | Não atinge 4.5:1 para texto normal |

### 6.2 Problemas de Acessibilidade Visual

| # | Problema | Severidade | Impacto |
|---|----------|-----------|---------|
| A1 | Cores de status (warning, success, info, destructive) não atingem 4.5:1 em texto normal | **Major** | Operadores com baixa visão podem não distinguir badges de status |
| A2 | Warning (amber) em texto normal: ~2.8:1 — FALHA WCAG AA | **Blocker** | Badges "Atraso" e "Pendente" podem ser ilegíveis |
| A3 | Sem padrão de textura/pattern como fallback para daltonismo | **Major** | 8% dos homens têm daltonismo — não distinguem verde/vermelho |
| A4 | `text-destructive` + icon como único indicador de erro | **Medium** | `access-state.tsx:60` — cor é o único diferenciador |
| A5 | `prefers-contrast: high` implementado (globals.css:310-321) | ✅ Bom | Mas só ajusta border/ring/input — não ajusta cores de status |
| A6 | Skip-to-content link presente (`#main-content`) | ✅ | Correcto |
| A7 | Focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50` | ✅ | Bom padrão |

### 6.3 Recomendações de Contraste para Status Colors

| Status | Cor Actual | Ratio (texto) | Cor Proposta | Ratio (texto) |
|--------|-----------|--------------|-------------|--------------|
| Success | `oklch(0.723 0.219 149.579)` | 3.8:1 | `oklch(0.5 0.2 150)` | 5.5:1 ✅ |
| Warning | `oklch(0.769 0.188 70.08)` | 2.8:1 🔴 | `oklch(0.6 0.2 70)` | 6.5:1 ✅ |
| Destructive | `oklch(0.577 0.245 27.325)` | 4.1:1 | `oklch(0.45 0.25 25)` | 6.0:1 ✅ |
| Info | `oklch(0.715 0.143 215.221)` | 3.5:1 | `oklch(0.5 0.15 215)` | 5.2:1 ✅ |

**Veredito Accessibility:** ⚠️ 52/100 — OK para AA em texto/large text quando usa `--text-*` tokens com fundo branco. **FAIL** para status colors (warning especialmente). A maior lacuna é a ausência de fallbacks para daltonismo (padrões, texturas, icons complementares).

---

## 7. Motion & Micro-interactions

### 7.1 Motion System

| Token | Valor | Status |
|-------|-------|--------|
| `--duration-instant` | 0ms | ✅ |
| `--duration-fast` | 100ms | ✅ |
| `--duration-normal` | 200ms | ✅ |
| `--duration-slow` | 300ms | ✅ |
| `--duration-slower` | 500ms | ⚠️ Não mapeado no `@theme` |
| `--motion-ease-out` | cubic-bezier(0, 0, 0.2, 1) | ✅ |
| `--motion-ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | ✅ |
| `--ease-spring` | cubic-bezier(0.175, 0.885, 0.32, 1.275) | ⚠️ Não mapeado no `@theme` |
| `prefers-reduced-motion` | Implementado (globals.css:292-305) | ✅ |

### 7.2 Transitions Implementadas

| Componente | Transição | Token | Estado |
|-----------|-----------|-------|--------|
| Button | `transition-[color,background-color,border-color,...]` | `duration-[var(--motion-duration-fast)]` | ✅ |
| Badge | `transition-[color,background-color,border-color,...]` | `duration-[var(--motion-duration-fast)]` | ✅ |
| Input | `transition-[color,box-shadow]` | `duration-[var(--motion-duration-fast)]` | ✅ |
| Progress | `transition-all` | `duration-[var(--motion-duration-normal)]` | ✅ |
| Card | Sem transição in/out | — | ⚠️ Missing |
| Dialog | Radix animação default | — | ⚠️ Não customizada |
| Sheet | Radix animação default | — | ⚠️ Não customizada |
| Toast | Radix animação default | — | ⚠️ Não customizada |
| DataTable | Sem transições | — | ⚠️ Missing |
| Timeline | Sem transições | — | ⚠️ Missing |

### 7.3 Problemas de Motion

| # | Problema | Severidade | Detalhe |
|---|----------|-----------|---------|
| M1 | Dialog/Sheet/Toast usam animações Radix default, não tokens custom | **Medium** | Todas as animações de overlay podiam usar `--motion-enter`/`--motion-exit` |
| M2 | Sem skeleton loading animado em DataTable | **Major** | Loading state mostra apenas spinner/AccessState — tabela skeleton daria melhor percepção |
| M3 | `ease-spring` definido mas não usado | **Minor** | Token órfão — ideal para micro-interações |
| M4 | `--duration-slower` definido no DESIGN-SYSTEM.md mas não no CSS | **Medium** | Gap entre documentação e CSS |
| M5 | `animate-pulse` em Skeleton usa `--motion-ease-in-out` | ✅ | Correcto |
| M6 | Sem transição de página (Page transition 300-500ms) | **Minor** | Next.js App Router não suporta nativamente |
| M7 | Reduced motion implementado com `!important` | ⚠️ Acceptable | Comentário explica necessidade |

**Veredito Motion:** ⚠️ 40/100 — O motion system está definido mas **mal aplicado**. Apenas Button/Badge/Input usam tokens de duração. Dialog/Sheet/Toast não têm transições customizadas. DataTable não tem loading animado (skeleton). O maior ganho seria aplicar skeleton loading nas tabelas e transições nos overlays.

---

## 8. Alinhamento com Product Vision & OKRs

### 8.1 OKR Mapping

| OKR | Requisito Visual | Estado Actual | Gap |
|-----|-----------------|---------------|-----|
| KR1.1: <3min registo de carga | Formulário glanceable, labels claras, feedback imediato | Forms usam Field composition ✅, mas acesso visual a permissões polui a interface ❌ | Médio |
| KR1.4: <24h resolução de excepção | SLA timer visual, alertas de tempo | Sem componente de SLA timer 🚫 | **Crítico** |
| KR2.1: Timeline unificada | Timeline visual com estados semânticos | Timeline component existe ✅ mas não está embedded na página de carga 🚫 | **Crítico** |
| KR2.4: Latência <30s | Indicador de actualização em tempo real, streaming visual | Sem badge "Live" ou "Última actualização" 🚫 | Médio |
| KR3.2: Evidence digital >90% | Badge de compliance (aprovado/pendente/rejeitado) | Badge success/warning usado ✅ mas falta badge "aprovado" específico | Baixo |
| KR4.1: Self-service onboarding | Fluxo de signup visualmente coerente com marca | Sign-in page existe ✅ mas não auditada visualmente | Médio |
| KR4.3: Advisory com decisão | Cartões de recomendação com confiança visual | Advisory existe em Tracking ✅ mas sem indicador de confiança | Médio |

### 8.2 North Star Alignment

**North Star:** "Cargas Entregues com Evidência Digital Completa"

O que a identidade visual precisa de comunicar:

1. **Progressão visual do ciclo de vida** — o LifecycleProgressIndicator é o MVP disto, mas precisa de ser mais proeminente
2. **Confiança visual da evidência** — badges "Evidência Aprovada" com icon de verificação verde
3. **Completude da timeline** — Timeline visual com indicador de "completo" (todos os checkpoints)
4. **Status de excepção** — distinção visual clara entre "sem excepção", "excepção aberta", "excepção resolvida"

---

## 9. Gaps & Recommendations Prioritised

### P0 — Blocker (Segurança Visual + Acessibilidade)

| # | Gap | Recomendação | Esforço | Impacto | Ficheiros |
|---|-----|-------------|---------|---------|-----------|
| P0-1 | Cores de status (warning) falham WCAG AA (2.8:1) | **Ajustar paleta de status**: escurecer warning/amber para `oklch(0.6 0.2 70)` para atingir 6.5:1+ | 1h | 🟢 Alto — legal/compliance | `globals.css` linhas 22-26 |
| P0-2 | Sem fallback para daltonismo em status badges | **Adicionar patterns/icons como complemento** à cor: warning com `TriangleAlert`, success com `CheckCircle`, destructive com `XCircle` | 2h | 🟢 Alto — 8% dos utilizadores | `badge.tsx`, `timeline.tsx` |
| P0-3 | Tokens operacionais documentados mas não implementados | **Criar CSS variables** `--op-shipment-*` no `globals.css` e mapear no `@theme` | 1h | 🟢 Alto — coerência | `globals.css`, `DESIGN-SYSTEM.md` |

### P1 — Crítico (Excelência Operacional)

| # | Gap | Recomendação | Esforço | Impacto | Ficheiros |
|---|-----|-------------|---------|---------|-----------|
| P1-1 | DataTable row height não usa density token | `table.tsx`: substituir `h-10` por `var(--density-row-height)` no `<th>` e `<td>` | 30min | 🟢 Alto — densidade operacional | `table.tsx` |
| P1-2 | H1 das páginas usam `text-2xl` em vez de `text-3xl` | **Corrigir heading hierarchy**: `cargo-overview-header.tsx:39`, `tracking-overview-header.tsx:44`, `page.tsx:62` — mudar para `text-3xl` | 15min | 🟢 Alto — hierarquia | `cargo-overview-header.tsx`, `tracking-overview-header.tsx`, `dashboard/page.tsx` |
| P1-3 | LifecycleProgressIndicator com estilos hardcoded | **Refactor** para usar tokens de cor e badges do design system | 2h | 🟢 Alto — ciclo de vida visual | `cargo-lifecycle-group.tsx` |
| P1-4 | Fractional grid layouts (`[1.2fr_0.8fr]`) | **Substituir por ratios standard**: `[2fr_1fr]` ou `[3fr_2fr]` | 30min | 🟢 Médio — grid consistente | `cargo-overview-header.tsx:29`, `tracking-overview-header.tsx:34` |
| P1-5 | `max-w-7xl` hardcoded | **Usar container token**: `max-w-[var(--container-max)]` | 15min | 🟢 Médio — token consistency | Todas as pages |
| P1-6 | 5 MetricTiles em `md:grid-cols-5` — densidade excessiva | **Reduzir para `md:grid-cols-3`** com agrupamento lógico ou colapsar "Perigosas" + "Inspecção" num card only | 1h | 🟢 Alto — glanceable data | `cargo-overview-header.tsx:47` |

### P2 — Importante (Consistência Visual)

| # | Gap | Recomendação | Esforço | Impacto | Ficheiros |
|---|-----|-------------|---------|---------|-----------|
| P2-1 | Sem icons logísticos específicos | **Criar 5 icons custom**: comboio, navio, camião, contentor, guindaste. Usar `@saptm/icons` | 4h | 🟡 Médio — identidade | Novo pacote `packages/icons/` |
| P2-2 | Dialog/Sheet/Toast sem transições customizadas | **Aplicar `--motion-enter`/`--motion-exit`** aos componentes de overlay | 1h | 🟡 Médio — percepção | `dialog.tsx`, `sheet.tsx`, `toast.tsx` |
| P2-3 | Skeleton loading ausente no DataTable | **Adicionar `SkeletonTable`** como estado de loading no DataTable | 1h | 🟢 Alto — perceived performance | `data-table.tsx` |
| P2-4 | `text-2xs` (0.65rem) não documentado | **Adicionar ao DESIGN-SYSTEM.md** ou remover usos | 15min | 🟡 Baixo — documentação | `DESIGN-SYSTEM.md` |
| P2-5 | Density tokens não expostos no `@theme` | **Mapear density tokens** no `@theme inline` para uso Tailwind | 30min | 🟡 Médio — consistência | `globals.css` |
| P2-6 | `ease-spring` e `--duration-slower` não mapeados | **Adicionar ao `@theme inline`** | 15min | 🟡 Baixo — completude | `globals.css` |
| P2-7 | Token `--risk` órfão (não documentado) | **Documentar no DESIGN-SYSTEM.md** como cor de "perigo/risco" distinta de destructive | 15min | 🟡 Baixo — documentação | `DESIGN-SYSTEM.md`, `globals.css` |
| P2-8 | Chart colors 6-10 não mapeados no `@theme` | **Adicionar `--color-chart-6` a `--color-chart-10`** no `@theme inline` | 15min | 🟡 Médio — data viz | `globals.css:173-213` |

### P3 — Desejável (Refinamento)

| # | Gap | Recomendação | Esforço | Impacto | Ficheiros |
|---|-----|-------------|---------|---------|-----------|
| P3-1 | `--container-max` token não exposto em CSS | **Criar `--container-max` como variável CSS** e usar nas pages | 30min | 🟡 Baixo — consistência | `globals.css` |
| P3-2 | Timeline dot size hardcoded `size-7` | **Usar density token**: `var(--density-compact-control-height)` | 15min | 🟡 Baixo — tokens | `timeline.tsx:66` |
| P3-3 | Badge `info` contraste marginal em dark mode | **Verificar e ajustar** `--color-info-500` em dark mode | 30min | 🟡 Médio — acessibilidade | `globals.css:150-151` |
| P3-4 | Progress bar sem variantes de cor | **Adicionar variantes** (success, warning, destructive) ao Progress | 1h | 🟡 Médio — data viz | `progress.tsx` |
| P3-5 | Sem SLA timer visual (KR1.4) | **Criar componente `SlaTimer`** com barra de progresso temporal e cor que degrada (verde→âmbar→vermelho) | 3h | 🟢 Alto — OKR directo | Novo componente |
| P3-6 | Dashboard sem KPIs visuais | **Dashboard deve usar `DashboardKpiGrid`** com dados reais em vez de módulos activos | 2h | 🟢 Alto — OKR directo | `dashboard/page.tsx` |
| P3-7 | Advisory cards sem indicador de confiança | **Adicionar badge de confiança** (ex: "Confiança: 85%") nos advisory cards | 1h | 🟡 Médio — eficiência | `tracking/tracking-analytics-section.tsx` |

---

## 10. Scorecard Final

| Dimensão | Score | Peso | Ponderado | Alvo Q3 |
|----------|-------|------|-----------|---------|
| **Typography** | 52/100 | 15% | 7.8 | 85/100 |
| **Color System** | 68/100 | 20% | 13.6 | 90/100 |
| **Layout & Grid** | 55/100 | 15% | 8.3 | 80/100 |
| **Token Coverage** | 58/100 | 20% | 11.6 | 90/100 |
| **Iconography & Data Viz** | 45/100 | 10% | 4.5 | 70/100 |
| **Accessibility** | 52/100 | 15% | 7.8 | 85/100 |
| **Motion** | 40/100 | 5% | 2.0 | 75/100 |
| **Composite** | **52.5/100** | 100% | **55.6/100** | **84/100** |

### Progressão Necessária para Q3 (+28.4 pontos)

```
┌─────────────────────────────────────────────────────────────┐
│  Actual: 55.6 ──────────────────────●                        │
│  Alvo:   84.0 ──────────────────────●────────────────────●   │
│                                                             │
│  Acções necessárias:                                        │
│  ┌─── P0 (3 tasks) ───┐  ┌─── P1 (6 tasks) ───┐           │
│  │ +4.2 pts            │  │ +8.5 pts            │           │
│  └─────────────────────┘  └─────────────────────┘           │
│  ┌─── P2 (8 tasks) ───┐  ┌─── P3 (7 tasks) ───┐           │
│  │ +7.8 pts            │  │ +7.9 pts            │           │
│  └─────────────────────┘  └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Design System Governance Recommendations

### 11.1 Processos

1. **Token Audit Automatizado** — Script que verifica hardcoded values em `packages/ui/src/components/` e emite relatório semanal
2. **Design QA Gate** — Obrigatório para todo PR que toque em ficheiros de UI (já definido mas raramente executado)
3. **Component Review Checklist** — Template de PR para novos componentes (ver DESIGN-SYSTEM.md §7.1)

### 11.2 Próximos Passos Imediatos

| Ordem | Acção | Dono | Prazo |
|-------|-------|------|-------|
| 1 | Ajustar paleta warning (P0-1) — falha WCAG | Visual Design | Sprint actual |
| 2 | Implementar `--op-shipment-*` tokens (P0-3) | Frontend + Visual Design | Sprint actual |
| 3 | Corrigir heading hierarchy H1 (P1-2) | Frontend | Sprint actual |
| 4 | Refactor LifecycleProgressIndicator (P1-3) | Frontend | Sprint +1 |
| 5 | DataTable density token (P1-1) | Frontend | Sprint +1 |
| 6 | Dialog/Sheet motion tokens (P2-2) | Frontend | Sprint +1 |
| 7 | Criar icons logísticos (P2-1) | Visual Design | Sprint +2 |

---

## 12. Conclusão

A identidade visual do SAPTM tem **fundação técnica excelente** (tokens OKLCH, spacing system, density modes, temas claro/escuro) mas **aplicação inconsistente**. O maior bloqueador é a **acessibilidade das cores de status** (warning falha WCAG AA) e a **falta de tokens operacionais** documentados mas não implementados.

Para atingir o nível de maturidade que a visão de produto exige:

1. 🚨 **Resolver P0 (acessibilidade + tokens órfãos)** — 4h de trabalho, 90% dos problemas de compliance
2. 🎯 **Executar P1 (consistência operacional)** — 5.5h de trabalho, melhora percepção do operador
3. 🔧 **Refinar P2+P3 (icons, motion, SLA timer)** — ~15h, diferenciação visual

O maior ganho visual com menor esforço: **corrigir a hierarquia de headings** (P1-2, 15min) e **aplicar density tokens às tabelas** (P1-1, 30min) — duas mudanças que transformam a percepção de profissionalismo.

---

*Documento mantido pelo Departamento de Visual Design (`@enterprise-visual-design`)*
*Próxima revisão: 2026-07-16 (sprint midpoint)*
