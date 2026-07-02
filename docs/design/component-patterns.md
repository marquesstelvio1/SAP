# Design System Component Patterns

> **Departamento:** Visual Design
> **Versão:** 1.0
> **Data:** 2026-07-02

## 1. Component Architecture

All components follow a consistent architecture:

```
Component.tsx
├── "use client" (when needed for interactivity)
├── Imports (shadcn primitives, lucide icons, utils)
├── Variants (class-variance-authority cva)
├── Component function
│   ├── Props interface
│   ├── Destructure with defaults
│   ├── Composition logic
│   └── className merging via cn()
└── displayName assignment
```

### Rules

1. **Props**: Always extend `React.ComponentProps<"element">` for native attributes
2. **asChild**: Use `Slot.Root` from `radix-ui` when composition is needed
3. **className**: Always use `cn()` from `@saptm/ui/lib/utils` for merging
4. **Forward ref**: Shadcn components use forwardRef pattern (some newer ones use direct function)
5. **Display name**: Always set `Component.displayName` for DevTools
6. **Data attributes**: Each root element gets `data-slot="component-name"`

## 2. Form Patterns

### Field Compositions

Forms use the `Field` family of components from `@saptm/ui`:

```tsx
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@saptm/ui";
import { Input } from "@saptm/ui";

// Vertical form (default)
<Field>
  <FieldLabel>Nome do cliente</FieldLabel>
  <FieldContent>
    <Input placeholder="Ex: Logística Porto SA" />
    <FieldError />
  </FieldContent>
</Field>

// Horizontal form
<Field orientation="horizontal">
  <FieldLabel>Email</FieldLabel>
  <FieldContent>
    <Input type="email" />
    <FieldError />
  </FieldContent>
</Field>

// Field group (section)
<FieldGroup>
  <FieldLegend>Dados do Remetente</FieldLegend>
  <Field>...</Field>
  <Field>...</Field>
</FieldGroup>
```

### Validation Pattern (Client-side)

```tsx
import { useForm } from "@saptm/form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

function MyForm() {
  const form = useForm({ schema, defaultValues: { name: "", email: "" } });
  
  return (
    <form onSubmit={form.handleSubmit((data) => console.log(data))}>
      <Field>
        <FieldLabel>Nome</FieldLabel>
        <FieldContent>
          <Input {...form.register("name")} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </FieldContent>
      </Field>
    </form>
  );
}
```

### Form States

| State | Visual | Implementation |
|-------|--------|----------------|
| Default | Normal input | Base styles |
| Focused | `border-ring` + `ring-[3px]` | `focus-visible:` |
| Error | `border-destructive` + red ring | `aria-invalid` |
| Disabled | Reduced opacity, no pointer | `disabled:` |
| Required | Asterisk on label | `<FieldLabel><span className="text-destructive">*</span></FieldLabel>` |
| Loading | Spinner + disabled | `Button disabled` + `<Spinner />` |
| Success | Green border briefly | `aria-invalid="false"` + success ring |

## 3. Data Display Patterns

### DataTable Pattern

The `DataTable` wraps `@tanstack/react-table` with styling:

```tsx
import { DataTable, type DataTableProps } from "@saptm/ui";

// Simple usage
<DataTable columns={columns} data={data} />

// With server-side pagination
<DataTable
  columns={columns}
  data={data}
  manualPagination
  pageCount={totalPages}
  pageIndex={currentPage}
  onPageChange={handlePageChange}
  pageSize={25}
/>

// With filter
<DataTable
  columns={columns}
  data={data}
  filterColumn="name"
  filterPlaceholder="Filtrar por nome..."
/>
```

### MetricTile Pattern

Used for KPIs and operational metrics:

```tsx
import { MetricTile } from "@saptm/ui";

// Simple metric
<MetricTile label="Cargas ativas" value={42} />

// With trend
<MetricTile
  label="Movimentações hoje"
  value={156}
  trend={{ direction: "up", value: "+12% vs. ontem" }}
/>

// With badge
<MetricTile
  label="Utilização de capacidade"
  value="78%"
  badge="próximo do limite"
  variant="warning"
/>
```

### AccessState Pattern

Unified component for loading, error, empty, and blocked states:

```tsx
import { AccessState } from "@saptm/ui";

// Loading
<AccessState
  badgeLabel="Tracking"
  title="A carregar ..."
  description="A obter eventos de tracking..."
/>

// Error
<AccessState
  badgeLabel="Cargas"
  title="Cargas indisponiveis"
  description="Nao foi possivel carregar a lista de cargas."
  variant="error"
/>

// Blocked (permission / plan limit)
<AccessState
  badgeLabel="Registo de cargas"
  title="Limite do plano atingido"
  description="O seu plano Free permite 50 cargas por mes."
  variant="blocked"
  cta={{ label: "Ver planos", href: "/app/settings/billing" }}
/>

// Permission check (inline)
<AccessState
  label="Registo de cargas"
  granted={canRegisterCargo}
/>
```

### ContextRow Pattern

Used for displaying key-value pairs in context panels:

```tsx
import { ContextRow } from "@saptm/ui";

<ContextRow label="Cliente" value="Logística Porto SA" />
<ContextRow label="Tipo de carga" value="Contentor 40'" />
<ContextRow label="Peso bruto" value="24.500 kg" description="inclui tara" />
```

## 4. Empty/Loading/Error State Patterns

Every data-driven component must handle all four states:

### Pattern Template

```tsx
function DataWidget({ data, isLoading, error }: Props) {
  // 1. Loading
  if (isLoading) {
    return <SkeletonTable rows={5} columns={3} />;
  }

  // 2. Error
  if (error) {
    return <ErrorCard title="Erro ao carregar" message={error.message} onRetry={refetch} />;
  }

  // 3. Empty
  if (!data || data.length === 0) {
    return <EmptyState title="Sem dados" description="Nenhum registo encontrado." />;
  }

  // 4. Data
  return <DataTable columns={columns} data={data} />;
}
```

### Loading States Library

| Component | When to Use |
|-----------|-------------|
| `Skeleton` | Inline loading placeholder |
| `SkeletonCard` | Loading card layout |
| `SkeletonMetricTile` | Loading metric tiles (grid) |
| `SkeletonTable` | Loading table (rows × columns) |
| `Spinner` | Button loading, async actions |
| `AccessState` (loading) | Full page loading with description |

### Empty States

| Variant | Usage |
|---------|-------|
| `EmptyState` | Generic empty data (no records) |
| `AccessState` variant="empty" | Blocked/restricted with permission context |

## 5. Badge Variants and Usage

### Semantic Badge Variants

| Variant | Usage | Example Content |
|---------|-------|----------------|
| `default` | Primary info, neutral | "Pendente" |
| `secondary` | Neutral emphasis | "Rascunho" |
| `success` | Positive confirmation | "Confirmado", "Entregue" |
| `warning` | Warning, near-limit | "Vencido", "Atenção" |
| `destructive` | Error, critical | "Cancelado", "Bloqueado" |
| `info` | Informational | "Novo", "Actualizado" |
| `outline` | Subtle, less emphasis | "Rascunho", "Lixeira" |

### Density-Aware Sizing

Badges automatically adjust height based on density:

```tsx
<Badge variant="success" density="compact">Activo</Badge>
<Badge variant="warning" density="operational">Atenção</Badge>
```

| Density | Height | Padding | Font |
|---------|--------|---------|------|
| Comfortable | `--density-comfortable-control-height` (2.75rem) | px-3 py-1 | text-sm |
| Compact (default) | `--density-compact-control-height` (2.25rem) | px-2 py-0.5 | text-xs |
| Operational | `--density-operational-control-height` (2rem) | px-1.5 py-0.5 | text-xs |

### Badge With Icon

```tsx
<Badge variant="success">
  <CheckIcon className="size-3" />
  Confirmado
</Badge>
```

### BadgeGroup for Multiple Badges

```tsx
import { BadgeGroup } from "@saptm/ui";

<BadgeGroup>
  <Badge variant="success">Activo</Badge>
  <Badge variant="info">Prioritário</Badge>
  <Badge variant="warning">Inspecção pendente</Badge>
</BadgeGroup>
```

## 6. Button Variants

### Semantic Button Variants

| Variant | Usage |
|---------|-------|
| `default` | Primary action (one per view) |
| `secondary` | Secondary actions |
| `outline` | Tertiary, less emphasis |
| `ghost` | Minimal, toolbars, navigation |
| `destructive` | Deletive, irreversible actions |
| `link` | Text-only link styled as button |

### Density-Aware Sizing

```tsx
<Button density="comfortable" size="default">Default</Button>
<Button density="compact" size="sm">Compact</Button>
<Button density="operational" size="icon">
  <PlusIcon />
</Button>
```

| Size | Density: Comfortable | Density: Compact | Density: Operational |
|------|---------------------|-------------------|---------------------|
| default | 2.75rem | 2.25rem | 2rem |
| sm | 2.5rem | 2rem | 1.75rem |
| lg | 3rem | 2.5rem | 2.25rem |
| icon | 2.75rem² | 2.25rem² | 2rem² |

## 7. Card Composition

```tsx
<Card>
  <CardHeader>
    <CardTitle>Subscrição</CardTitle>
    <CardDescription>Detalhes do plano atual</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Card Variants by Context

| Context | Styling |
|---------|---------|
| Default card | `rounded-xl border bg-card shadow-panel` |
| Metric tile | `p-4` inside Card, large value text |
| Context panel | Dense, compact padding, `p-3` |
| Empty/error state | Centered content, `p-8`, larger icon |
| Form section | Standard card with `gap-6` field groups |

## 8. Navigation Patterns

### Sidebar Structure

```
SidebarProvider (density, defaultOpen)
└── Sidebar (collapsible="icon")
    ├── SidebarHeader
    │   └── TeamSwitcher (organization selector)
    ├── SidebarContent
    │   └── NavMain (grouped navigation items)
    │       ├── SidebarGroup
    │       │   ├── SidebarGroupLabel
    │       │   └── SidebarMenu
    │       │       └── SidebarMenuItem > SidebarMenuButton
    │       └── ...
    ├── SidebarFooter
    │   └── NavUser (user menu with settings, logout)
    └── SidebarRail (resize handle)
```

### Breadcrumb Pattern

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Faturação</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

## 9. Modal/Dialog Patterns

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descrição opcional</DialogDescription>
    </DialogHeader>
    {/* Form or content */}
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Sheet (Slide-over) Pattern

Use `Sheet` for secondary content or forms that don't need a full page:

```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Detalhes</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Detalhes da Carga</SheetTitle>
    </SheetHeader>
    {/* Dense content */}
  </SheetContent>
</Sheet>
```

## 10. Data Visualization Patterns

### Chart Composition

```tsx
import { ChartContainer, ChartTooltipContent } from "@saptm/ui";

<ChartContainer config={chartConfig} className="aspect-video">
  <BarChart data={data}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="value" fill="var(--color-primary)" radius={4} />
  </BarChart>
</ChartContainer>
```

### Timeline Pattern

```tsx
import { Timeline, TimelineItem } from "@saptm/ui";

<Timeline>
  <TimelineItem status="completed" timestamp="2024-01-15 09:00">
    <p>Carga registada</p>
  </TimelineItem>
  <TimelineItem status="current" timestamp="2024-01-15 14:30">
    <p>Em trânsito para o porto</p>
  </TimelineItem>
  <TimelineItem status="pending" timestamp="Previsão: 2024-01-16">
    <p>Chegada ao porto</p>
  </TimelineItem>
</Timeline>
```
