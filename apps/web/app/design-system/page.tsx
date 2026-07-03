"use client";

import {
  AccessState,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  BadgeGroup,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  ContextRow,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorCard,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Label,
  MetricTile,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectNative,
  SelectTrigger,
  SelectValue,
  Separator,
  SkeletonCard,
  SkeletonMetricTile,
  SkeletonTable,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Timeline,
  TimelineItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon, InfoIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

/* -------------------------------------------------------------------------- */
/* Data for interactive components                                             */
/* -------------------------------------------------------------------------- */

interface TableItem {
  id: string;
  name: string;
  role: string;
  status: string;
}

const tableData: TableItem[] = [
  { id: "1", name: "Joao Silva", role: "Operador", status: "Ativo" },
  { id: "2", name: "Maria Santos", role: "Supervisor", status: "Ativo" },
  { id: "3", name: "Carlos Pereira", role: "Gestor", status: "Inativo" },
  { id: "4", name: "Ana Costa", role: "Analista", status: "Ativo" },
  { id: "5", name: "Pedro Alves", role: "Operador", status: "Ativo" },
  { id: "6", name: "Lucia Martins", role: "Coordenador", status: "Ativo" },
  { id: "7", name: "Rui Oliveira", role: "Tecnico", status: "Inativo" },
  { id: "8", name: "Sofia Rodrigues", role: "Gestor", status: "Ativo" },
  { id: "9", name: "Miguel Ferreira", role: "Supervisor", status: "Ativo" },
  { id: "10", name: "Ines Ribeiro", role: "Analista", status: "Ativo" },
  { id: "11", name: "Diogo Carvalho", role: "Operador", status: "Ativo" },
  { id: "12", name: "Rita Gomes", role: "Tecnico", status: "Ativo" },
];

const tableColumns: ColumnDef<TableItem>[] = [
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "role", header: "Funcao" },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "Ativo" ? "success" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
];

/* -------------------------------------------------------------------------- */
/* Section wrapper                                                             */
/* -------------------------------------------------------------------------- */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 mt-10 border-b pb-2 text-2xl font-bold first:mt-0">{children}</h2>;
}

function SectionGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-start gap-4">{children}</div>;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function DesignSystemPage() {
  const [radioValue, setRadioValue] = useState("option-1");
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-4xl font-bold tracking-heading">Design System</h1>
      <p className="mb-8 text-muted-foreground">
        Componentes visuais do SAPTM para referencia e regression testing.
      </p>

      {/* ── 1. Typography ─────────────────────────────────────────────────── */}
      <SectionHeading>1. Typography</SectionHeading>
      <Card className="p-6">
        <h1 className="text-4xl font-bold">Heading 1 (h1)</h1>
        <h2 className="mt-2 text-3xl font-bold">Heading 2 (h2)</h2>
        <h3 className="mt-2 text-2xl font-bold">Heading 3 (h3)</h3>
        <h4 className="mt-2 text-xl font-bold">Heading 4 (h4)</h4>
        <h5 className="mt-2 text-lg font-bold">Heading 5 (h5)</h5>
        <h6 className="mt-2 text-base font-bold">Heading 6 (h6)</h6>
        <p className="mt-4 text-base">
          Body text — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Small / muted text</p>
        <p className="mt-2 text-xs text-muted-foreground">Caption / label text</p>
        <code className="mt-2 block rounded bg-muted px-2 py-1 font-mono text-sm">
          Monospace: const app = &quot;SAPTM&quot;;
        </code>
      </Card>

      {/* ── 2. Buttons ────────────────────────────────────────────────────── */}
      <SectionHeading>2. Buttons</SectionHeading>
      <Card className="p-6">
        <h3 className="mb-3 font-semibold">Variants</h3>
        <SectionGrid>
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </SectionGrid>
        <h3 className="mb-3 mt-4 font-semibold">Sizes</h3>
        <SectionGrid>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <SearchIcon className="size-4" />
          </Button>
        </SectionGrid>
        <h3 className="mb-3 mt-4 font-semibold">States</h3>
        <SectionGrid>
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
        </SectionGrid>
      </Card>

      {/* ── 3. Badges ─────────────────────────────────────────────────────── */}
      <SectionHeading>3. Badges</SectionHeading>
      <Card className="p-6">
        <SectionGrid>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </SectionGrid>
        <h3 className="mb-3 mt-4 font-semibold">Badge Group</h3>
        <BadgeGroup
          items={[
            { label: "Ativo", variant: "success" },
            { label: "Pendente", variant: "warning" },
            { label: "Bloqueado", variant: "destructive" },
            { label: "Info", variant: "info" },
          ]}
        />
      </Card>

      {/* ── 4. Cards ──────────────────────────────────────────────────────── */}
      <SectionHeading>4. Cards</SectionHeading>
      <div className="flex flex-wrap gap-4">
        <Card className="w-72">
          <CardHeader>
            <CardTitle>Cartao Simples</CardTitle>
            <CardDescription>Com titulo e descricao</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Conteudo do cartao com informacao relevante.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Acao</Button>
          </CardFooter>
        </Card>
        <Card className="w-72">
          <CardContent className="pt-6">
            <p className="text-sm">Cartao apenas com conteudo, sem header ou footer.</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 5. Inputs ─────────────────────────────────────────────────────── */}
      <SectionHeading>5. Inputs</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Default Input</FieldLabel>
            <FieldContent>
              <Input placeholder="Digite algo..." />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Disabled Input</FieldLabel>
            <FieldContent>
              <Input disabled value="Valor desativado" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Input com erro</FieldLabel>
            <FieldContent>
              <Input aria-invalid="true" defaultValue="valor invalido" />
              <FieldError>Este campo e obrigatório.</FieldError>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Com descricao</FieldLabel>
            <FieldContent>
              <Input placeholder="Email corporativo" />
              <FieldDescription>Use seu email corporativo.</FieldDescription>
            </FieldContent>
          </Field>
        </div>
      </Card>

      {/* ── 6. Select Native ──────────────────────────────────────────────── */}
      <SectionHeading>6. Select Native</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-wrap gap-4">
          <SelectNative defaultValue="option-1" className="w-48">
            <option value="option-1">Opcao 1</option>
            <option value="option-2">Opcao 2</option>
            <option value="option-3">Opcao 3</option>
          </SelectNative>
          <SelectNative disabled className="w-48">
            <option>Desativado</option>
          </SelectNative>
        </div>
      </Card>

      {/* ── 7. Select (new) ───────────────────────────────────────────────── */}
      <SectionHeading>7. Select (Radix)</SectionHeading>
      <Card className="p-6">
        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="item-1">Item 1</SelectItem>
            <SelectItem value="item-2">Item 2</SelectItem>
            <SelectItem value="item-3">Item 3</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* ── 8. Checkbox ───────────────────────────────────────────────────── */}
      <SectionHeading>8. Checkbox</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-3">
          <Label className="flex items-center gap-2">
            <Checkbox checked={checked1} onCheckedChange={(c) => setChecked1(Boolean(c))} />
            Default
          </Label>
          <Label className="flex items-center gap-2">
            <Checkbox checked={checked2} onCheckedChange={(c) => setChecked2(Boolean(c))} />
            Checked
          </Label>
          <Label className="flex items-center gap-2">
            <Checkbox disabled />
            Disabled unchecked
          </Label>
          <Label className="flex items-center gap-2">
            <Checkbox disabled checked />
            Disabled checked
          </Label>
        </div>
      </Card>

      {/* ── 9. Switch ─────────────────────────────────────────────────────── */}
      <SectionHeading>9. Switch</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-3">
          <Label className="flex items-center gap-2">
            <Switch />
            Default
          </Label>
          <Label className="flex items-center gap-2">
            <Switch defaultChecked />
            Checked
          </Label>
          <Label className="flex items-center gap-2">
            <Switch disabled />
            Disabled unchecked
          </Label>
          <Label className="flex items-center gap-2">
            <Switch disabled defaultChecked />
            Disabled checked
          </Label>
        </div>
      </Card>

      {/* ── 10. Radio ──────────────────────────────────────────────────────── */}
      <SectionHeading>10. Radio Group</SectionHeading>
      <Card className="p-6">
        <RadioGroup value={radioValue} onValueChange={setRadioValue}>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="option-1" />
            Opcao 1
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="option-2" />
            Opcao 2
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="option-3" disabled />
            Disabled
          </Label>
        </RadioGroup>
      </Card>

      {/* ── 11. Textarea ──────────────────────────────────────────────────── */}
      <SectionHeading>11. Textarea</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Default Textarea</FieldLabel>
            <FieldContent>
              <Textarea placeholder="Digite uma descricao..." />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Com valor</FieldLabel>
            <FieldContent>
              <Textarea defaultValue="Este e um texto preenchido para demonstracao do componente Textarea." />
            </FieldContent>
          </Field>
        </div>
      </Card>

      {/* ── 12. Tabs ──────────────────────────────────────────────────────── */}
      <SectionHeading>12. Tabs</SectionHeading>
      <Card className="p-6">
        <Tabs defaultValue="tab-1">
          <TabsList>
            <TabsTrigger value="tab-1">Aba 1</TabsTrigger>
            <TabsTrigger value="tab-2">Aba 2</TabsTrigger>
            <TabsTrigger value="tab-3">Aba 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1" className="p-4 text-sm">
            Conteudo da primeira aba.
          </TabsContent>
          <TabsContent value="tab-2" className="p-4 text-sm">
            Conteudo da segunda aba.
          </TabsContent>
          <TabsContent value="tab-3" className="p-4 text-sm">
            Conteudo da terceira aba.
          </TabsContent>
        </Tabs>
      </Card>

      {/* ── 13. Dialog / AlertDialog ──────────────────────────────────────── */}
      <SectionHeading>13. Dialog &amp; AlertDialog</SectionHeading>
      <Card className="p-6">
        <SectionGrid>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog de Exemplo</DialogTitle>
                <DialogDescription>
                  Esta e uma janela de dialogo para demonstracao.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm">Conteudo do dialogo.</p>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogTrigger>
                <Button>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Abrir AlertDialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>Esta acao não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SectionGrid>
      </Card>

      {/* ── 14. Tooltip ───────────────────────────────────────────────────── */}
      <SectionHeading>14. Tooltip</SectionHeading>
      <Card className="p-6">
        <TooltipProvider>
          <SectionGrid>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tooltip content</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-sm underline decoration-dotted">
                  Texto com tooltip
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Informacao adicional sobre este texto.</p>
              </TooltipContent>
            </Tooltip>
          </SectionGrid>
        </TooltipProvider>
      </Card>

      {/* ── 15. Toast ─────────────────────────────────────────────────────── */}
      <SectionHeading>15. Toast</SectionHeading>
      <Card className="p-6">
        <SectionGrid>
          <Button
            variant="outline"
            onClick={() => toast.success("Operação concluida com sucesso!")}
          >
            Toast Success
          </Button>
          <Button variant="outline" onClick={() => toast.error("Erro ao processar requisicao.")}>
            Toast Error
          </Button>
          <Button variant="outline" onClick={() => toast.info("Informacao disponível.")}>
            Toast Info
          </Button>
          <Button
            variant="outline"
            onClick={() => toast("Mensagem padrao", { description: "Descricao detalhada." })}
          >
            Toast Default
          </Button>
        </SectionGrid>
      </Card>

      {/* ── 16. Avatar ────────────────────────────────────────────────────── */}
      <SectionHeading>16. Avatar</SectionHeading>
      <Card className="p-6">
        <SectionGrid>
          <Avatar>
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>CP</AvatarFallback>
          </Avatar>
        </SectionGrid>
      </Card>

      {/* ── 17. Sidebar ───────────────────────────────────────────────────── */}
      <SectionHeading>17. Sidebar</SectionHeading>
      <Card className="overflow-hidden p-0">
        <div className="flex">
          <div className="w-64 border-r bg-sidebar text-sidebar-foreground">
            <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/20 font-bold text-sidebar-primary text-xs">
                S
              </div>
              <span className="font-semibold text-sm">SAPTM</span>
            </div>
            <nav className="flex flex-col gap-2 px-4 py-5">
              <span className="px-2 pb-0.5 pt-1.5 font-medium text-2xs text-sidebar-foreground/55 uppercase tracking-widest">
                Navegacao
              </span>
              <div className="flex flex-col gap-1">
                <span
                  data-active="true"
                  className="flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors bg-sidebar-accent text-sidebar-accent-foreground"
                >
                  Dashboard
                </span>
                <span className="flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors text-sidebar-foreground/82 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground">
                  Cargas
                </span>
                <span className="flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors text-sidebar-foreground/82 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground">
                  Tracking
                </span>
                <span className="flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors text-sidebar-foreground/82 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground">
                  Capacidade
                </span>
              </div>
            </nav>
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/20 font-medium text-sidebar-primary text-xs">
                  AD
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">Admin User</p>
                  <p className="truncate text-sidebar-foreground/60 text-xs">admin@saptm.local</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 p-6">
            <p className="text-sm text-muted-foreground">
              Sidebar em estado expandido com navegacao e user card.
            </p>
          </div>
        </div>
      </Card>

      {/* ── 18. Data Table ────────────────────────────────────────────────── */}
      <SectionHeading>18. Data Table</SectionHeading>
      <Card className="p-6">
        <DataTable
          columns={tableColumns}
          data={tableData}
          pageSize={5}
          filterColumn="name"
          filterPlaceholder="Filtrar por nome..."
          emptyMessage="Nenhum resultado."
        />
      </Card>

      {/* ── 19. Pagination ────────────────────────────────────────────────── */}
      <SectionHeading>19. Pagination</SectionHeading>
      <Card className="p-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">8</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Card>

      {/* ── 20. Progress ──────────────────────────────────────────────────── */}
      <SectionHeading>20. Progress</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-sm">25%</p>
            <Progress value={25} />
          </div>
          <div>
            <p className="mb-1 text-sm">50%</p>
            <Progress value={50} />
          </div>
          <div>
            <p className="mb-1 text-sm">75%</p>
            <Progress value={75} />
          </div>
          <div>
            <p className="mb-1 text-sm">100%</p>
            <Progress value={100} />
          </div>
        </div>
      </Card>

      {/* ── 21. Spinner ───────────────────────────────────────────────────── */}
      <SectionHeading>21. Spinner</SectionHeading>
      <Card className="p-6">
        <SectionGrid>
          <Spinner />
          <Spinner className="size-8" />
          <Spinner className="size-10 text-primary" />
        </SectionGrid>
      </Card>

      {/* ── 22. Skeleton ──────────────────────────────────────────────────── */}
      <SectionHeading>22. Skeleton</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-wrap gap-6">
          <div className="w-48">
            <SkeletonCard />
          </div>
          <div className="w-48">
            <SkeletonMetricTile />
          </div>
          <div className="w-full max-w-md">
            <SkeletonTable rows={3} columns={4} />
          </div>
        </div>
      </Card>

      {/* ── 23. Empty State ───────────────────────────────────────────────── */}
      <SectionHeading>23. Empty State</SectionHeading>
      <Card className="p-6">
        <EmptyState
          icon={<SearchIcon className="size-6" />}
          title="Nenhum resultado encontrado"
          description="Tente ajustar sua pesquisa ou filtros."
          action={<Button variant="outline">Limpar filtros</Button>}
        />
      </Card>

      {/* ── 24. Error Card ────────────────────────────────────────────────── */}
      <SectionHeading>24. Error Card</SectionHeading>
      <Card className="p-6">
        <ErrorCard
          title="Erro de conexao"
          message="Não foi possivel conectar ao servidor. Verifique sua conexao."
          onRetry={() => {}}
        />
      </Card>

      {/* ── 25. Breadcrumb ────────────────────────────────────────────────── */}
      <SectionHeading>25. Breadcrumb</SectionHeading>
      <Card className="p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Cargas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Detalhes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Card>

      {/* ── 26. Timeline ──────────────────────────────────────────────────── */}
      <SectionHeading>26. Timeline</SectionHeading>
      <Card className="p-6">
        <Timeline>
          <TimelineItem status="completed" title="Carga registada" timestamp="10:30">
            <p className="text-sm text-muted-foreground">Registo inicial da carga no sistema.</p>
          </TimelineItem>
          <TimelineItem status="completed" title="Documentacao verificada" timestamp="11:15" />
          <TimelineItem status="current" title="Em transito" timestamp="14:00">
            <p className="text-sm text-muted-foreground">Carga saiu do terminal de origem.</p>
          </TimelineItem>
          <TimelineItem status="pending" title="Chegada prevista" timestamp="Amanha, 08:00" />
          <TimelineItem status="warning" title="Alfandega" description="Documentacao pendente" />
          <TimelineItem status="error" title="Atraso" description="Fecho de via programado" />
        </Timeline>
      </Card>

      {/* ── 27. Metric Tile ───────────────────────────────────────────────── */}
      <SectionHeading>27. Metric Tile</SectionHeading>
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricTile
            label="Cargas Ativas"
            value="1,247"
            badge="+12%"
            variant="success"
            trend={{ direction: "up", value: "+3.2% esta semana" }}
          />
          <MetricTile
            label="Em Transito"
            value="892"
            badge="Ativo"
            variant="info"
            trend={{ direction: "up", value: "+5.1% esta semana" }}
          />
          <MetricTile
            label="Atrasos"
            value="23"
            badge="Critico"
            variant="destructive"
            trend={{ direction: "down", value: "-2.1% esta semana" }}
          />
          <MetricTile
            label="Entregues"
            value="4,391"
            badge="Concluido"
            variant="success"
            trend={{ direction: "up", value: "+8.7% este mes" }}
          />
        </div>
      </Card>

      {/* ── 28. Context Row ───────────────────────────────────────────────── */}
      <SectionHeading>28. Context Row</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <ContextRow label="Cliente" value="Transportes ABC, Lda" />
          <ContextRow label="Referencia" value="CARGO-2024-001" />
          <ContextRow label="Origem" value="Porto de Luanda" />
          <ContextRow label="Destino" value="Terminal Ferroviário" description="Eixo central" />
          <ContextRow label="Prioridade" value="Alta" muted={false} />
        </div>
      </Card>

      {/* ── 29. Access State ──────────────────────────────────────────────── */}
      <SectionHeading>29. Access State</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <AccessState granted label="Registo autorizado" />
          <AccessState granted={false} label="Registo indisponível" />
          <AccessState
            variant="blocked"
            title="Acesso Bloqueado"
            description="Não tem permissão para aceder a esta pagina."
            status="403"
          />
          <AccessState
            variant="error"
            title="Erro de Carregamento"
            description="Ocorreu um erro ao carregar os dados."
            status="500"
          />
          <AccessState
            variant="empty"
            title="Sem Dados"
            description="Não existem registos para mostrar."
          />
        </div>
      </Card>

      {/* ── 30. Alert ─────────────────────────────────────────────────────── */}
      <SectionHeading>30. Alert</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-3">
          <Alert>
            <InfoIcon className="size-4" />
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>Operação concluida com sucesso.</AlertDescription>
          </Alert>
          <Alert className="border-destructive/50 text-destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>Falha ao processar a requisicao.</AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* ── 31. Separator ─────────────────────────────────────────────────── */}
      <SectionHeading>31. Separator</SectionHeading>
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <p className="text-sm">Conteudo acima do separador.</p>
          <Separator />
          <p className="text-sm">Conteudo abaixo do separador.</p>
          <div className="flex h-12 items-center gap-4">
            <span className="text-sm">Esquerda</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Direita</span>
          </div>
        </div>
      </Card>

      {/* ── 32. Search Palette Trigger ────────────────────────────────────── */}
      <SectionHeading>32. Search Palette</SectionHeading>
      <Card className="p-6">
        <p className="mb-3 text-sm text-muted-foreground">
          Pressione{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">Cmd+K</kbd> para
          abrir a paleta de pesquisa.
        </p>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Cmd+K para abrir")}>
          <SearchIcon className="size-4" />
          <span>Pesquisar...</span>
          <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
            Cmd+K
          </kbd>
        </Button>
      </Card>
    </div>
  );
}
