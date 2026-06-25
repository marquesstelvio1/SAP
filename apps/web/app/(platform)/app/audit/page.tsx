import type { PlatformPermission } from "@saptm/auth";
import {
  type AuditSearchInput,
  auditActorTypes,
  auditSearchInputSchema,
  auditSeverities,
} from "@saptm/rpc/audit";
import {
  AccessState,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  JsonBlock,
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

import { searchAuditRecords } from "../../../../lib/audit-records";
import { requirePlatformSession } from "../../../../lib/auth-session";

export const dynamic = "force-dynamic";

const readAuditPermission: PlatformPermission = "audit.read";
const exportReportPermission: PlatformPermission = "report.export";

const severityLabels = {
  critical: "Critica",
  high: "Alta",
  low: "Baixa",
  medium: "Media",
} as const;

const actorTypeLabels = {
  ai_agent: "AI Agent",
  anonymous: "Anonimo",
  integration: "Integracao",
  platform: "Plataforma",
  service_account: "Service Account",
  user: "Utilizador",
} as const;

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const platformSession = await requirePlatformSession("/app/audit");
  const viewerPermissions = platformSession.viewer.permissions;
  const canReadAudit = viewerPermissions.includes(readAuditPermission);
  const canExportAudit =
    viewerPermissions.includes(readAuditPermission) &&
    viewerPermissions.includes(exportReportPermission);

  if (!canReadAudit) {
    return (
      <AccessState
        badgeLabel="Audit"
        message="A sessao esta autenticada, mas falta audit.read para pesquisar auditoria."
        role="alert"
        status="Sem grant"
        title="Auditoria bloqueada"
      />
    );
  }

  const rawSearchParams = await searchParams;
  const parsedFilters = parseAuditSearchParams(rawSearchParams);
  const auditInput = parsedFilters.input;
  const result = await searchAuditRecords(auditInput);

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Audit"
        message={result.message}
        role="alert"
        status={result.status}
        title="Auditoria indisponivel"
      />
    );
  }

  const { search } = result;
  const exportHref = buildAuditExportHref(auditInput);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Audit P1</Badge>
              <Badge variant="outline">audit.read</Badge>
              <Badge variant={canExportAudit ? "success" : "warning"}>
                {canExportAudit ? "report.export ativo" : "sem report.export"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Audit trail operacional</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Pesquisa tenant-scoped de eventos criticos: ator, permissao, correlacao, sujeito,
                severidade, payloads before/after e exportacao CSV auditada.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <MetricTile label="Registos" value={search.totals.records.toString()} />
            <MetricTile label="Criticos" value={search.totals.critical.toString()} />
            <MetricTile label="Altos" value={search.totals.high.toString()} />
            <MetricTile label="Medios" value={search.totals.medium.toString()} />
            <MetricTile label="Baixos" value={search.totals.low.toString()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportacao</CardTitle>
            <CardDescription>Exporta o snapshot filtrado e grava audit/outbox.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ContextRow label="Tenant" value={search.organizationId} />
            <ContextRow label="Gerado em" value={formatDateTime(search.generatedAt)} />
            <ContextRow label="Limite" value={search.filters.limit.toString()} />
            {canExportAudit ? (
              <Button asChild>
                <a href={exportHref}>Exportar CSV</a>
              </Button>
            ) : (
              <Button disabled type="button">
                Exportar CSV
              </Button>
            )}
            <span className="text-muted-foreground text-xs">
              {canExportAudit
                ? "A exportacao exige audit.read + report.export."
                : "Requer report.export para exportar."}
            </span>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisa e filtros</CardTitle>
          <CardDescription>
            Filtros sao enviados ao RPC de auditoria; sem filtros, retorna os eventos recentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parsedFilters.message === undefined ? null : (
            <div
              className="mb-4 rounded-lg border bg-muted/35 p-3 text-muted-foreground text-sm"
              role="status"
            >
              {parsedFilters.message}
            </div>
          )}
          <form method="get">
            <fieldset className="contents">
              <legend className="sr-only">Filtrar registos de auditoria</legend>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field>
                    <FieldLabel htmlFor="auditAction">Acao</FieldLabel>
                    <Input
                      defaultValue={auditInput.action ?? ""}
                      id="auditAction"
                      name="action"
                      placeholder="cargo.registered"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditSubjectType">Subject type</FieldLabel>
                    <Input
                      defaultValue={auditInput.subjectType ?? ""}
                      id="auditSubjectType"
                      name="subjectType"
                      placeholder="cargo"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditSubjectId">Subject ID</FieldLabel>
                    <Input
                      defaultValue={auditInput.subjectId ?? ""}
                      id="auditSubjectId"
                      name="subjectId"
                      placeholder="cargo_..."
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditCorrelationId">Correlation ID</FieldLabel>
                    <Input
                      defaultValue={auditInput.correlationId ?? ""}
                      id="auditCorrelationId"
                      name="correlationId"
                      placeholder="corr_..."
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  <Field>
                    <FieldLabel htmlFor="auditSeverity">Severidade</FieldLabel>
                    <SelectNative
                      defaultValue={auditInput.severity ?? ""}
                      id="auditSeverity"
                      name="severity"
                    >
                      <option value="">Todas</option>
                      {auditSeverities.map((severity) => (
                        <option key={severity} value={severity}>
                          {severityLabels[severity]}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditActorType">Ator</FieldLabel>
                    <SelectNative
                      defaultValue={auditInput.actorType ?? ""}
                      id="auditActorType"
                      name="actorType"
                    >
                      <option value="">Todos</option>
                      {auditActorTypes.map((actorType) => (
                        <option key={actorType} value={actorType}>
                          {actorTypeLabels[actorType]}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditActorId">Actor ID</FieldLabel>
                    <Input
                      defaultValue={auditInput.actorId ?? ""}
                      id="auditActorId"
                      name="actorId"
                      placeholder="user_..."
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditCreatedFrom">Desde</FieldLabel>
                    <Input
                      defaultValue={toDatetimeLocalValue(auditInput.createdFrom)}
                      id="auditCreatedFrom"
                      name="createdFrom"
                      type="datetime-local"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditCreatedTo">Ate</FieldLabel>
                    <Input
                      defaultValue={toDatetimeLocalValue(auditInput.createdTo)}
                      id="auditCreatedTo"
                      name="createdTo"
                      type="datetime-local"
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Field className="max-w-36">
                    <FieldLabel htmlFor="auditLimit">Limite</FieldLabel>
                    <SelectNative
                      defaultValue={auditInput.limit.toString()}
                      id="auditLimit"
                      name="limit"
                    >
                      {[10, 25, 50, 100].map((limit) => (
                        <option key={limit} value={limit}>
                          {limit}
                        </option>
                      ))}
                    </SelectNative>
                  </Field>
                  <Button type="submit">Pesquisar</Button>
                  <Button asChild variant="outline">
                    <Link href={"/app/audit" as Route}>Limpar filtros</Link>
                  </Button>
                </div>
              </FieldGroup>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registos auditados</CardTitle>
          <CardDescription>
            Cada linha mostra detalhe operacional e payloads para investigacao.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Registos auditados">
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Acao</TableHead>
                <TableHead>Sujeito</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {search.records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} role="status">
                    Nenhum registo encontrado para os filtros.
                  </TableCell>
                </TableRow>
              ) : (
                search.records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDateTime(record.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={resolveSeverityVariant(record.severity)}>
                        {severityLabels[record.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{record.action}</span>
                        <span className="text-muted-foreground text-xs">
                          Corr.: {record.correlationId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{record.subjectType}</span>
                        <span className="text-muted-foreground text-xs">
                          {record.subjectId ?? "sem subjectId"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{actorTypeLabels[record.actorType]}</span>
                        <span className="text-muted-foreground text-xs">
                          {record.actorId ?? "sem actorId"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <details className="max-w-xl">
                        <summary
                          className="cursor-pointer font-medium text-sm"
                          aria-label={`Detalhe do registo ${record.action}`}
                        >
                          Ver detalhe
                        </summary>
                        <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/35 p-3">
                          <ContextRow label="Reason" value={record.reason ?? "Sem reason"} />
                          <ContextRow label="IP" value={record.ipAddress ?? "Nao registado"} />
                          <ContextRow
                            label="User agent"
                            value={record.userAgent ?? "Nao registado"}
                          />
                          <JsonBlock label="Before" value={record.before} />
                          <JsonBlock label="After" value={record.after} />
                        </div>
                      </details>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function parseAuditSearchParams(rawSearchParams: Record<string, string | string[] | undefined>): {
  input: AuditSearchInput;
  message?: string;
} {
  const rawInput = {
    action: readOptionalSearchParam(rawSearchParams, "action"),
    actorId: readOptionalSearchParam(rawSearchParams, "actorId"),
    actorType: readOptionalSearchParam(rawSearchParams, "actorType"),
    correlationId: readOptionalSearchParam(rawSearchParams, "correlationId"),
    createdFrom: readOptionalDateSearchParam(rawSearchParams, "createdFrom"),
    createdTo: readOptionalDateSearchParam(rawSearchParams, "createdTo"),
    limit: readLimitSearchParam(rawSearchParams),
    severity: readOptionalSearchParam(rawSearchParams, "severity"),
    subjectId: readOptionalSearchParam(rawSearchParams, "subjectId"),
    subjectType: readOptionalSearchParam(rawSearchParams, "subjectType"),
  };
  const parsed = auditSearchInputSchema.safeParse(removeUndefinedValues(rawInput));

  if (parsed.success) {
    return {
      input: parsed.data,
    };
  }

  return {
    input: auditSearchInputSchema.parse(undefined),
    message: `Filtros invalidos ignorados: ${parsed.error.issues
      .map((issue) => issue.message)
      .join(" ")}`,
  };
}

function buildAuditExportHref(input: AuditSearchInput): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  return `/app/audit/export?${searchParams.toString()}`;
}

function readOptionalSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = searchParams[name];
  const normalized = Array.isArray(value) ? value.at(0) : value;

  if (normalized === undefined || normalized.trim().length === 0) {
    return undefined;
  }

  return normalized.trim();
}

function readOptionalDateSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = readOptionalSearchParam(searchParams, name);

  if (value === undefined) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function readLimitSearchParam(searchParams: Record<string, string | string[] | undefined>): number {
  const value = readOptionalSearchParam(searchParams, "limit");

  if (value === undefined) {
    return 25;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 25;
}

function removeUndefinedValues(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toDatetimeLocalValue(value: string | undefined): string {
  if (value === undefined) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function resolveSeverityVariant(
  severity: keyof typeof severityLabels,
): "outline" | "success" | "warning" | "destructive" {
  if (severity === "critical") {
    return "destructive";
  }

  if (severity === "high") {
    return "warning";
  }

  if (severity === "low") {
    return "success";
  }

  return "outline";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
