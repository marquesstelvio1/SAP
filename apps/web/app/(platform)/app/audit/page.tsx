import type { PlatformPermission } from "@saptm/auth";
import {
  type AuditSearchInput,
  auditActorTypes,
  auditSearchInputSchema,
  auditSeverities,
} from "@saptm/rpc/audit";
import {
  AccessState,
  Alert,
  AlertDescription,
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
  MetricTile,
  SelectNative,
} from "@saptm/ui";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { AuditRecordsTable } from "../../../../components/audit/audit-records-table";
import { searchAuditRecords } from "../../../../lib/audit-records";
import { requirePlatformSession } from "../../../../lib/auth-session";

export const metadata: Metadata = {
  title: "Auditoria",
  description: "Registo de eventos auditados, pesquisa e exportação de logs operacionais.",
};

export const dynamic = "force-dynamic";

const readAuditPermission: PlatformPermission = "audit.read";
const exportReportPermission: PlatformPermission = "report.export";

const severityLabels = {
  critical: "Crítica",
  high: "Alta",
  low: "Baixa",
  medium: "Média",
} as const;

const actorTypeLabels = {
  ai_agent: "Agente IA",
  anonymous: "Anónimo",
  integration: "Integração",
  platform: "Plataforma",
  service_account: "Conta de Serviço",
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
        badgeLabel="Auditoria"
        description="O utilizador autenticado não tem acesso ao módulo de auditoria."
        role="alert"
        title="Auditoria bloqueada"
        variant="blocked"
      />
    );
  }

  const rawSearchParams = await searchParams;
  const parsedFilters = parseAuditSearchParams(rawSearchParams);
  const auditInput = parsedFilters.input;

  let auditResult: Awaited<ReturnType<typeof searchAuditRecords>>;
  try {
    auditResult = await searchAuditRecords(auditInput);
  } catch (_error) {
    return (
      <AccessState
        badgeLabel="Auditoria"
        description="Ocorreu um erro inesperado ao pesquisar registos de auditoria."
        role="alert"
        title="Auditoria indisponível"
        variant="error"
      />
    );
  }

  if (auditResult.status === "unauthorized") {
    redirect("/sign-in?reason=session_expired");
  }

  if (auditResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Auditoria"
        description={auditResult.message}
        role="alert"
        title="Auditoria indisponível"
        variant="error"
      />
    );
  }

  const { search } = auditResult;
  const exportHref = buildAuditExportHref(auditInput);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-layout-main">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Auditoria</Badge>
              <Badge variant={canExportAudit ? "success" : "warning"}>
                {canExportAudit ? "Exportação activa" : "Exportação indisponível"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Auditoria operacional</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Pesquisa de eventos críticos: ator, permissão, correlação, sujeito, severidade,
                payloads antes/depois e exportação CSV auditada.
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
            <CardTitle>Exportação</CardTitle>
            <CardDescription>Exporta a pesquisa filtrada e regista a operação.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
                ? "A exportação está disponível para este utilizador."
                : "A exportação não está autorizada para este utilizador."}
            </span>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisa e filtros</CardTitle>
          <CardDescription>
            Filtros são enviados ao serviço de auditoria; sem filtros, retorna os eventos recentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parsedFilters.message === undefined ? null : (
            <Alert className="mb-4">
              <AlertDescription>{parsedFilters.message}</AlertDescription>
            </Alert>
          )}
          <form method="get">
            <fieldset className="contents">
              <legend className="sr-only">Filtrar registos de auditoria</legend>
              <FieldGroup>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field>
                    <FieldLabel htmlFor="auditAction">Ação</FieldLabel>
                    <Input
                      defaultValue={auditInput.action ?? ""}
                      id="auditAction"
                      name="action"
                      placeholder="ex.: registo de carga"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditSubjectType">Tipo de sujeito</FieldLabel>
                    <Input
                      defaultValue={auditInput.subjectType ?? ""}
                      id="auditSubjectType"
                      name="subjectType"
                      placeholder="carga"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditSubjectId">ID do sujeito</FieldLabel>
                    <Input
                      defaultValue={auditInput.subjectId ?? ""}
                      id="auditSubjectId"
                      name="subjectId"
                      placeholder="CAR-001"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="auditCorrelationId">ID de correlação</FieldLabel>
                    <Input
                      defaultValue={auditInput.correlationId ?? ""}
                      id="auditCorrelationId"
                      name="correlationId"
                      placeholder="COR-001"
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
                    <FieldLabel htmlFor="auditActorId">ID do ator</FieldLabel>
                    <Input
                      defaultValue={auditInput.actorId ?? ""}
                      id="auditActorId"
                      name="actorId"
                      placeholder="utilizador"
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
                    <FieldLabel htmlFor="auditCreatedTo">Até</FieldLabel>
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
            Cada linha mostra detalhe operacional e payloads para investigação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditRecordsTable records={search.records} />
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
    message: `Filtros inválidos ignorados: ${parsed.error.issues
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
