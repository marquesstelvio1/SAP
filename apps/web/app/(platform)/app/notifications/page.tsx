import type { PlatformPermission } from "@saptm/auth";
import {
  AccessState,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  MetricTile,
  SelectNative,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { formatDateTime, formatNullableDateTime } from "@/lib/format";
import { NotificationMarkReadForm } from "../../../../components/notification/notification-mark-read-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getNotificationInbox } from "../../../../lib/notifications";
import { markNotificationReadFormAction } from "./actions";

export const dynamic = "force-dynamic";

const readNotificationPermission: PlatformPermission = "notification.read";
const notificationStatusOptions = ["all", "unread", "read", "archived"] as const;

type NotificationStatusFilter = (typeof notificationStatusOptions)[number];

type NotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const platformSession = await requirePlatformSession("/app/notifications");
  const permissions = platformSession.viewer.permissions;
  const canReadNotifications = permissions.includes(readNotificationPermission);
  const rawSearchParams = await searchParams;
  const status = parseStatusFilter(rawSearchParams.status);
  const limit = parseLimit(rawSearchParams.limit);

  if (!canReadNotifications) {
    return (
      <AccessState
        badgeLabel="Notificações"
        description="O utilizador autenticado não tem acesso a inbox de notificações."
        role="alert"
        title="Inbox bloqueada"
        variant="blocked"
      />
    );
  }

  let inboxResult: Awaited<ReturnType<typeof getNotificationInbox>>;

  try {
    inboxResult = await getNotificationInbox({
      limit,
      ...(status === "all" ? {} : { status }),
    });
  } catch {
    return (
      <AccessState
        badgeLabel="Notificações"
        description="API não respondeu dentro do tempo limite."
        role="alert"
        title="Inbox indisponível"
        variant="error"
      />
    );
  }

  if (inboxResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Notificações"
        description={inboxResult.message}
        role="alert"
        title="Inbox indisponível"
        variant="error"
      />
    );
  }

  const inbox = inboxResult.inbox;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Processador de eventos</Badge>
          <Badge variant={inbox.totals.unread > 0 ? "warning" : "success"}>
            {inbox.totals.unread > 0 ? `${inbox.totals.unread} por ler` : "Sem pendencias"}
          </Badge>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-semibold text-3xl tracking-heading">Inbox operacional</h1>
          <p className="mt-2 text-muted-foreground">
            Notificações operacionais geradas pelo sistema. Cada item e filtrável, auditável e pode
            ser reconhecido por utilizadores autorizados.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricTile label="Total" value={inbox.totals.notifications} />
        <MetricTile label="Por ler" value={inbox.totals.unread} variant="warning" badge="Por ler" />
        <MetricTile label="Lidas" value={inbox.totals.read} variant="success" badge="Lidas" />
        <MetricTile label="Arquivadas" value={inbox.totals.archived} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de inbox</CardTitle>
          <CardDescription>
            Use filtros leves para validar o processamento de eventos sem abrir dominios de negocio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 md:flex-row md:items-end">
            <fieldset className="contents">
              <legend className="sr-only">Filtrar notificações</legend>
              <FieldGroup className="md:max-w-xs">
                <Field>
                  <FieldLabel htmlFor="notificationStatus">Estado</FieldLabel>
                  <SelectNative defaultValue={status} id="notificationStatus" name="status">
                    <option value="all">Todos</option>
                    <option value="unread">Por ler</option>
                    <option value="read">Lidas</option>
                    <option value="archived">Arquivadas</option>
                  </SelectNative>
                </Field>
              </FieldGroup>
              <FieldGroup className="md:max-w-xs">
                <Field>
                  <FieldLabel htmlFor="notificationLimit">Limite</FieldLabel>
                  <Input
                    defaultValue={limit.toString()}
                    id="notificationLimit"
                    max={100}
                    min={1}
                    name="limit"
                    type="number"
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" variant="outline">
                Aplicar filtros
              </Button>
              <Button asChild variant="ghost">
                <Link href={"/app/notifications" as Route}>Limpar</Link>
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos processados</CardTitle>
          <CardDescription>
            Lista gerada em {formatDateTime(inbox.generatedAt, { dateStyle: "short" })}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inbox.notifications.length === 0 ? (
            <div
              className="rounded-lg border border-dashed bg-muted/20 p-6 text-muted-foreground text-sm"
              role="status"
            >
              Nenhuma notificacao encontrada para os filtros atuais. Execute o worker apos gerar
              eventos operacionais para popular esta inbox.
            </div>
          ) : (
            <Table aria-label="Eventos processados">
              <TableHeader>
                <TableRow>
                  <TableHead>Notificacao</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criada</TableHead>
                  <TableHead>Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inbox.notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="min-w-[18rem] whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{notification.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {notification.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{notification.eventType}</span>
                        <span className="text-muted-foreground text-xs">
                          {notification.aggregateType} - {notification.aggregateId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Badge variant={getSeverityVariant(notification.severity)}>
                          {notification.severity}
                        </Badge>
                        <Badge variant={getStatusVariant(notification.status)}>
                          {notification.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(notification.createdAt, { dateStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      {notification.status === "unread" ? (
                        <NotificationMarkReadForm
                          action={markNotificationReadFormAction}
                          notificationId={notification.id}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Lida em {formatNullableDateTime(notification.readAt)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function parseStatusFilter(value: string | string[] | undefined): NotificationStatusFilter {
  const rawValue = Array.isArray(value) ? value.at(0) : value;

  return notificationStatusOptions.includes(rawValue as NotificationStatusFilter)
    ? (rawValue as NotificationStatusFilter)
    : "all";
}

function parseLimit(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value.at(0) : value;
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return 25;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function getSeverityVariant(severity: string): "destructive" | "outline" | "warning" {
  if (severity === "critical") {
    return "destructive";
  }

  if (severity === "high") {
    return "warning";
  }

  return "outline";
}

function getStatusVariant(status: string): "outline" | "success" | "warning" {
  if (status === "unread") {
    return "warning";
  }

  if (status === "read") {
    return "success";
  }

  return "outline";
}
