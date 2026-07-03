"use client";

import type { WebhookEndpointSummary } from "@saptm/rpc/webhooks";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  SelectNative,
} from "@saptm/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState } from "react";
import { createWebhookAction, deleteWebhookAction, updateWebhookAction } from "./actions";

type WebhookFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialFormState: WebhookFormState = {
  status: "idle",
  message: "",
};

type WebhooksSettingsContentProps = {
  initialData: WebhookEndpointSummary[];
  canManage: boolean;
};

export function WebhooksSettingsContent({ initialData }: WebhooksSettingsContentProps) {
  const router = useRouter();
  const [webhooks] = useState<WebhookEndpointSummary[]>(initialData);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpointSummary | null>(null);
  const [editingEvents, setEditingEvents] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [eventsInput, setEventsInput] = useState("");

  const [createState, createFormAction, createPending] = useActionState(
    createWebhookAction,
    initialFormState,
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateWebhookAction,
    initialFormState,
  );
  const [_deleteState, deleteFormAction] = useActionState(deleteWebhookAction, initialFormState);

  if (createState.status === "success") {
    router.refresh();
    setCreateOpen(false);
  }

  if (updateState.status === "success") {
    router.refresh();
    setEditOpen(false);
    setEditingWebhook(null);
  }

  const openEditDialog = (webhook: WebhookEndpointSummary) => {
    setEditingWebhook(webhook);
    setEditingEvents(webhook.events.join(", "));
    setEditOpen(true);
  };

  const domainEvents = [
    { value: "cargo.registered", label: "Carga Registada" },
    { value: "cargo.released", label: "Carga Liberada" },
    { value: "cargo.transport_planned", label: "Transporte Planeado" },
    { value: "cargo.transport_departed", label: "Transporte Partiu" },
    { value: "cargo.transport_arrived", label: "Transporte Chegou" },
    { value: "cargo.delivery_completed", label: "Entrega Concluida" },
    { value: "cargo.delivery_exception.recorded", label: "Exceção Registada" },
    { value: "cargo.delivery_exception.resolved", label: "Exceção Resolvida" },
    { value: "tracking.event.recorded", label: "Evento de Tracking" },
    { value: "tracking.exception.managed", label: "Exceção de Tracking" },
    { value: "capacity.slot.opened", label: "Slot Aberto" },
    { value: "capacity.slot.reserved", label: "Slot Reservado" },
    { value: "planning.transport_order.confirmed", label: "Ordem Confirmada" },
    { value: "planning.transport_order.dispatched", label: "Ordem Despachada" },
    { value: "planning.transport_order.cancelled", label: "Ordem Cancelada" },
    { value: "tariff.quote.calculated", label: "Cotação Calculada" },
    { value: "tariff.quote.approved", label: "Cotação Aprovada" },
  ];

  const columns: ColumnDef<WebhookEndpointSummary>[] = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <span className="max-w-[300px] truncate font-mono text-xs">{row.original.url}</span>
      ),
    },
    {
      accessorKey: "events",
      header: "Eventos",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.events.length > 2 ? (
            <Badge variant="outline" density="compact">
              {row.original.events.length} eventos
            </Badge>
          ) : (
            row.original.events.map((event) => (
              <Badge key={event} variant="secondary" density="compact">
                {event}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"} density="compact">
          {row.original.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastTriggeredAt",
      header: "Ultimo disparo",
      cell: ({ row }) =>
        row.original.lastTriggeredAt
          ? new Date(row.original.lastTriggeredAt).toLocaleString("pt-PT")
          : "-",
    },
    {
      accessorKey: "failureCount",
      header: "Falhas",
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const webhook = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(webhook)}>Editar</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={deleteFormAction}>
                  <input type="hidden" name="webhookId" value={webhook.id} />
                  <button
                    type="submit"
                    className="w-full rounded-sm text-left text-destructive outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    Remover
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const formId = useId();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-heading">Notificações</h1>
          <p className="text-muted-foreground text-sm">
            Endpoints HTTP para receber eventos da organização.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <PlusIcon className="size-4" />
              Nova notificação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar notificação</DialogTitle>
              <DialogDescription>
                Configura um endpoint HTTP para receber eventos da organização.
              </DialogDescription>
            </DialogHeader>
            <form action={createFormAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-name`}>Nome</Label>
                <Input
                  id={`${formId}-name`}
                  name="name"
                  placeholder="Ex: Notificações externas"
                  required
                  minLength={2}
                  maxLength={160}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-url`}>URL</Label>
                <Input
                  id={`${formId}-url`}
                  name="url"
                  type="url"
                  placeholder="https://exemplo.com/webhook"
                  required
                  maxLength={2048}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-events`}>Eventos</Label>
                <SelectNative
                  id={`${formId}-events`}
                  name="events"
                  multiple
                  className="h-32"
                  value={eventsInput.split(",").filter(Boolean)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setEventsInput(selected.join(","));
                  }}
                >
                  {domainEvents.map((event) => (
                    <option key={event.value} value={event.value}>
                      {event.label}
                    </option>
                  ))}
                </SelectNative>
                <input type="hidden" name="events" value={eventsInput} />
                <p className="text-muted-foreground text-xs">
                  Seleciona um ou mais eventos (usa Ctrl+Click para multiplos).
                </p>
              </div>
              {createState.status === "error" && (
                <p className="text-destructive text-sm">{createState.message}</p>
              )}
              <Button type="submit" disabled={createPending}>
                {createPending ? "A criar..." : "Criar notificação"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={webhooks}
        filterColumn="name"
        filterPlaceholder="Filtrar por nome..."
        emptyMessage="Nenhuma notificação configurada. Cria uma notificação para começar a receber eventos."
        pageSize={25}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar notificação</DialogTitle>
            <DialogDescription>Atualiza as configurações da notificação.</DialogDescription>
          </DialogHeader>
          {editingWebhook && (
            <form action={updateFormAction} className="flex flex-col gap-4">
              <input type="hidden" name="webhookId" value={editingWebhook.id} />
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-edit-name`}>Nome</Label>
                <Input
                  id={`${formId}-edit-name`}
                  name="name"
                  defaultValue={editingWebhook.name}
                  minLength={2}
                  maxLength={160}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-edit-url`}>URL</Label>
                <Input
                  id={`${formId}-edit-url`}
                  name="url"
                  type="url"
                  defaultValue={editingWebhook.url}
                  maxLength={2048}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${formId}-edit-events`}>Eventos</Label>
                <SelectNative
                  id={`${formId}-edit-events`}
                  name="events"
                  multiple
                  className="h-32"
                  value={editingEvents.split(",").filter(Boolean)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setEditingEvents(selected.join(","));
                  }}
                >
                  {domainEvents.map((event) => (
                    <option key={event.value} value={event.value}>
                      {event.label}
                    </option>
                  ))}
                </SelectNative>
                <input type="hidden" name="events" value={editingEvents} />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`${formId}-edit-active`}>Ativo</Label>
                <Checkbox
                  id={`${formId}-edit-active`}
                  name="isActive"
                  value="true"
                  defaultChecked={editingWebhook.isActive}
                />
              </div>
              {updateState.status === "error" && (
                <p className="text-destructive text-sm">{updateState.message}</p>
              )}
              <Button type="submit" disabled={updatePending}>
                {updatePending ? "A atualizar..." : "Atualizar notificação"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
