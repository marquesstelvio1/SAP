import type { PlatformPermission } from "@saptm/auth";
import {
  AccessState,
  Badge,
  BadgeGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
  MetricTile,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";
import { CapacityAdvisoryDecisionForm } from "../../../../components/capacity/capacity-advisory-decision-form";
import { CapacityPreCheck } from "../../../../components/capacity/capacity-pre-check";
import { CapacityResourceRegisterForm } from "../../../../components/capacity/capacity-resource-register-form";
import { CapacitySlotCancelForm } from "../../../../components/capacity/capacity-slot-cancel-form";
import { CapacitySlotOpenForm } from "../../../../components/capacity/capacity-slot-open-form";
import { CapacitySlotReserveForm } from "../../../../components/capacity/capacity-slot-reserve-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import {
  advisoryDecisionStatusLabels,
  advisoryTypeLabels,
  reservationPurposeLabels,
  resolveAdvisorySeverityVariant,
  resolveSlotStatusVariant,
  resourceTypeLabels,
  slotStatusLabels,
} from "../../../../lib/capacity";
import { getCapacityAdvisory } from "../../../../lib/capacity-advisory";
import { getCapacityAdvisoryDecisionAnalytics } from "../../../../lib/capacity-advisory-decision-analytics";
import { getCapacityOverview } from "../../../../lib/capacity-overview";
import {
  cancelCapacitySlotReservationAction,
  openCapacitySlotAction,
  recordCapacityAdvisoryDecisionAction,
  registerCapacityResourceAction,
  reserveCapacitySlotAction,
} from "./actions";
import {
  initialCapacityAdvisoryDecisionFormState,
  initialCapacityResourceRegisterFormState,
  initialCapacitySlotCancelFormState,
  initialCapacitySlotOpenFormState,
  initialCapacitySlotReserveFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

const readCapacityPermission: PlatformPermission = "capacity.read";
const manageCapacityPermission: PlatformPermission = "capacity.manage";
const reserveCapacityPermission: PlatformPermission = "capacity.slot.reserve";
const cancelCapacityPermission: PlatformPermission = "capacity.slot.cancel";
const decideCapacityAdvisoryPermission: PlatformPermission = "capacity.advisory.decide";

export default async function CapacityOverviewPage() {
  const platformSession = await requirePlatformSession("/app/capacity");
  const viewerPermissions = platformSession.viewer.permissions;
  const canManageCapacity = viewerPermissions.includes(manageCapacityPermission);
  const canReserveCapacity = viewerPermissions.includes(reserveCapacityPermission);
  const canCancelCapacity = viewerPermissions.includes(cancelCapacityPermission);
  const canDecideCapacityAdvisory = viewerPermissions.includes(decideCapacityAdvisoryPermission);

  if (!viewerPermissions.includes(readCapacityPermission)) {
    return (
      <AccessState
        badgeLabel="Capacity / Slot Constraints"
        message="A sessao esta autenticada, mas falta a permissao capacity.read para abrir o modulo."
        role="alert"
        status="Sem grant"
        title="Capacidade operacional bloqueada"
      />
    );
  }

  const [result, advisoryResult, advisoryDecisionAnalyticsResult] = await Promise.all([
    getCapacityOverview(),
    getCapacityAdvisory(5),
    getCapacityAdvisoryDecisionAnalytics(10, 30),
  ]);

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Capacity / Slot Constraints"
        message={result.message}
        role="alert"
        status={result.status}
        title="Capacidade operacional indisponivel"
      />
    );
  }

  if (advisoryResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Capacity / Slot Constraints"
        message={advisoryResult.message}
        role="alert"
        status={advisoryResult.status}
        title="Advisory de capacidade indisponivel"
      />
    );
  }

  if (advisoryDecisionAnalyticsResult.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Capacity / Slot Constraints"
        message={advisoryDecisionAnalyticsResult.message}
        role="alert"
        status={advisoryDecisionAnalyticsResult.status}
        title="Analytics de decisoes de advisory indisponivel"
      />
    );
  }

  const { overview } = result;
  const { advisory } = advisoryResult;
  const { analytics: advisoryDecisionAnalytics } = advisoryDecisionAnalyticsResult;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <BadgeGroup
              items={[
                { label: "Business P9", variant: "success" },
                { label: "Capacity / Slot Constraints", variant: "outline" },
              ]}
            />
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Capacidade operacional governada</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Recursos, janelas e reservas de capacidade para ferrovia, porto e logistica. O
                backend opera sem overbooking e bloqueia duplicidade, janela invalida e carga
                inelegivel antes de qualquer automacao.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <MetricTile label="Recursos" value={overview.totals.resources.toString()} />
            <MetricTile label="Slots abertos" value={overview.totals.openSlots.toString()} />
            <MetricTile label="Bloqueados" value={overview.totals.blockedSlots.toString()} />
            <MetricTile label="Fechados" value={overview.totals.closedSlots.toString()} />
            <MetricTile
              label="Reservas ativas"
              value={overview.totals.activeReservations.toString()}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto de seguranca</CardTitle>
            <CardDescription>Escopo resolvido por Better Auth, RBAC e organizacao.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow label="Organization" value={overview.organizationId} />
            <ContextRow label="Session" value={platformSession.sessionId} />
            <ContextRow label="Leitura" value={readCapacityPermission} />
            <ContextRow label="Gestao" value={manageCapacityPermission} />
            <ContextRow label="Reserva" value={reserveCapacityPermission} />
            <ContextRow label="Cancelamento" value={cancelCapacityPermission} />
            <ContextRow label="Decisao advisory" value={decideCapacityAdvisoryPermission} />
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
                href={"/app/audit?action=capacity.slot.reserve&limit=25" as Route}
              >
                Auditoria de reservas
              </Link>
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
                href={"/app/audit?subjectType=capacity&limit=25" as Route}
              >
                Auditoria de capacidade
              </Link>
              <Link
                className="inline-flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1 text-[0.65rem] text-muted-foreground underline-offset-4 hover:bg-muted/40 hover:underline"
                href={"/app/reports" as Route}
              >
                Reports
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Slots operacionais</CardTitle>
            <CardDescription>Proximas janelas tenant-scoped para capacidade.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Slots operacionais">
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Janela</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.upcomingSlots.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={5} role="status">
                      Sem slots abertos ou historicos neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.upcomingSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{slot.slotReference}</span>
                          <span className="text-muted-foreground text-xs">{slot.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>{slot.resourceCode}</span>
                          <span className="text-muted-foreground text-xs">
                            {resourceTypeLabels[slot.resourceType]} · {slot.locationName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {slot.windowStartAt} → {slot.windowEndAt}
                      </TableCell>
                      <TableCell>
                        <Badge variant={slot.availableUnits > 0 ? "success" : "warning"}>
                          {slot.availableUnits}/{slot.capacityUnits}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resolveSlotStatusVariant(slot.status)}>
                          {slotStatusLabels[slot.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reservas recentes</CardTitle>
            <CardDescription>Historico de reservas e cancelamentos auditaveis.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Reservas recentes">
              <TableHeader>
                <TableRow>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Carga</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentReservations.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4} role="status">
                      Sem reservas neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recentReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{reservation.reservationReference}</span>
                          <span className="text-muted-foreground text-xs">
                            {reservation.reservedUnits} unidade(s)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{reservation.cargoReference}</TableCell>
                      <TableCell>
                        {reservationPurposeLabels[reservation.reservationPurpose]}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reservation.status === "reserved" ? "success" : "outline"}>
                          {reservation.status === "reserved" ? "Reservada" : "Cancelada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <BadgeGroup
              items={[
                { label: "Capacity advisory", variant: "warning" },
                { label: "Sem automacao direta", variant: "outline" },
              ]}
            />
            <CardTitle>Otimizacao assistida de capacidade</CardTitle>
            <CardDescription>
              Recomenda saturacao, baixa utilizacao, janelas a expirar e concentracao de reservas.
              Toda acao continua protegida por RBAC, idempotencia, audit trail e aprovacao humana.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {advisory.recommendations.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 p-4 text-muted-foreground text-sm">
                Sem recomendacoes de capacidade para a janela atual.
              </div>
            ) : (
              advisory.recommendations.map((recommendation) => (
                <Card className="flex flex-col gap-3 p-4 shadow-none" key={recommendation.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={resolveAdvisorySeverityVariant(recommendation.severity)}>
                      {recommendation.severity}
                    </Badge>
                    <Badge variant="outline">{advisoryTypeLabels[recommendation.type]}</Badge>
                    <Badge variant="secondary">
                      {(recommendation.confidenceScore * 100).toFixed(0)}% confianca
                    </Badge>
                    <Badge variant="outline">
                      {recommendation.metrics.utilizationPercent.toFixed(1)}% uso
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{recommendation.title}</h3>
                    <p className="text-muted-foreground text-sm">{recommendation.rationale}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-sm">
                    {recommendation.recommendedAction}
                  </div>
                  {recommendation.slot === null ? null : (
                    <ContextRow
                      label={recommendation.slot.slotReference}
                      value={`${recommendation.slot.resourceCode} · ${recommendation.metrics.availableUnits} unidade(s) livres`}
                    />
                  )}
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <Card id="capacity-optimization-policy">
          <CardHeader>
            <CardTitle>Politica de otimizacao</CardTitle>
            <CardDescription>
              O motor local apenas recomenda; abertura, reserva e cancelamento continuam por
              comandos governados.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ContextRow
              label="Automacao"
              value={advisory.policy.automationAllowed ? "Permitida" : "Bloqueada"}
            />
            <ContextRow
              label="Aprovacao humana"
              value={advisory.policy.humanApprovalRequired ? "Obrigatoria" : "Nao exigida"}
            />
            <ContextRow label="Fonte" value={advisory.policy.source} />
            <ContextRow label="Operacao" value="capacity.optimization.advisory.read" />
            <ContextRow label="Transporte" value="GET /rpc/capacity/advisory" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card id="capacity-advisory-decision-analytics">
          <CardHeader>
            <BadgeGroup
              items={[
                { label: "Business P20", variant: "info" },
                { label: "Decision analytics", variant: "outline" },
              ]}
            />
            <CardTitle>Analytics de decisoes de advisory</CardTitle>
            <CardDescription>
              Mede aprovacao/rejeicao de recomendacoes gravadas por humanos. Este bloco e read-only
              e nao executa abertura, reserva ou cancelamento de capacidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <MetricTile
              label="Decisoes"
              value={advisoryDecisionAnalytics.totals.decisions.toString()}
            />
            <MetricTile
              label="Aprovadas"
              value={advisoryDecisionAnalytics.totals.approved.toString()}
            />
            <MetricTile
              label="Rejeitadas"
              value={advisoryDecisionAnalytics.totals.rejected.toString()}
            />
            <MetricTile
              label="Taxa aprov."
              value={`${advisoryDecisionAnalytics.totals.approvalRatePercent.toFixed(1)}%`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governanca das decisoes</CardTitle>
            <CardDescription>
              Agregados por tipo de recomendacao e permissao operacional exigida.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <ContextRow
              label="Janela"
              value={`${advisoryDecisionAnalytics.window.windowDays} dias`}
            />
            <ContextRow
              label="Read-only"
              value={advisoryDecisionAnalytics.governance.readOnly ? "Sim" : "Nao"}
            />
            <ContextRow
              label="Automacao"
              value={
                advisoryDecisionAnalytics.governance.automationAllowed ? "Permitida" : "Bloqueada"
              }
            />
            <ContextRow label="Operacao" value="capacity.advisory.decision.analytics.read" />
            <ContextRow
              label="Com aprovacao"
              value={advisoryDecisionAnalytics.totals.decisionsWithApprovalReference.toString()}
            />
            <ContextRow
              label="Permissao operacional"
              value={advisoryDecisionAnalytics.totals.decisionsRequiringOperationalPermission.toString()}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decisoes por tipo</CardTitle>
            <CardDescription>Distribuicao das decisoes humanas por recomendacao.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Decisoes por tipo">
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Decisoes</TableHead>
                  <TableHead>Aprovadas</TableHead>
                  <TableHead>Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisoryDecisionAnalytics.byRecommendationType.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4} role="status">
                      Sem decisoes de advisory na janela atual.
                    </TableCell>
                  </TableRow>
                ) : (
                  advisoryDecisionAnalytics.byRecommendationType.map((group) => (
                    <TableRow key={group.recommendationType}>
                      <TableCell>{advisoryTypeLabels[group.recommendationType]}</TableCell>
                      <TableCell>{group.decisions}</TableCell>
                      <TableCell>{group.approved}</TableCell>
                      <TableCell>{group.approvalRatePercent.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Decisoes recentes</CardTitle>
            <CardDescription>Ultimas decisoes gravadas com evidencia humana.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table aria-label="Decisoes recentes">
              <TableHeader>
                <TableRow>
                  <TableHead>Recomendacao</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Permissao</TableHead>
                  <TableHead>Decisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisoryDecisionAnalytics.recentDecisions.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={4} role="status">
                      Sem decisoes humanas registadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  advisoryDecisionAnalytics.recentDecisions.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell className="font-medium">
                        {advisoryTypeLabels[decision.recommendationType]}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={decision.decisionStatus === "approved" ? "success" : "warning"}
                        >
                          {advisoryDecisionStatusLabels[decision.decisionStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>{decision.requiredPermission}</TableCell>
                      <TableCell>{decision.decidedByName}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CapacityResourceRegisterForm
          action={registerCapacityResourceAction}
          canManageCapacity={canManageCapacity}
          initialState={initialCapacityResourceRegisterFormState}
        />

        <CapacitySlotOpenForm
          action={openCapacitySlotAction}
          canManageCapacity={canManageCapacity}
          initialState={initialCapacitySlotOpenFormState}
        />
      </section>

      <section>
        <CapacityAdvisoryDecisionForm
          action={recordCapacityAdvisoryDecisionAction}
          canDecideCapacityAdvisory={canDecideCapacityAdvisory}
          initialState={initialCapacityAdvisoryDecisionFormState}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-4">
          <CapacityPreCheck
            slots={overview.upcomingSlots.map((slot) => ({
              id: slot.id,
              slotReference: slot.slotReference,
              resourceCode: slot.resourceCode,
              resourceType: slot.resourceType,
              locationName: slot.locationName,
              windowStartAt: slot.windowStartAt,
              windowEndAt: slot.windowEndAt,
              capacityUnits: slot.capacityUnits,
              availableUnits: slot.availableUnits,
              status: slot.status,
            }))}
            cargoEligibility={null}
          />
          <CapacitySlotReserveForm
            action={reserveCapacitySlotAction}
            canReserveCapacity={canReserveCapacity}
            initialState={initialCapacitySlotReserveFormState}
          />
        </div>

        <CapacitySlotCancelForm
          action={cancelCapacitySlotReservationAction}
          canCancelCapacity={canCancelCapacity}
          initialState={initialCapacitySlotCancelFormState}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Regras aplicadas</CardTitle>
          <CardDescription>
            O frontend mostra comandos; as regras finais vivem no backend transacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <ContextRow label="Recurso" value="codigo unico + limite positivo + idempotencia" />
          <ContextRow label="Slot" value="janela valida + limite por recurso + referencia unica" />
          <ContextRow
            label="Reserva"
            value="cargo elegivel + slot aberto + capacidade disponivel"
          />
          <ContextRow
            label="Cancelamento"
            value="reserva ativa + data valida + release de unidades"
          />
          <ContextRow label="Advisory" value="consultivo + decisao humana + sem automacao direta" />
        </CardContent>
      </Card>
    </div>
  );
}
