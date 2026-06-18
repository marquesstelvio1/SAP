import type { PlatformPermission } from "@saptm/auth";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import type { Route } from "next";
import Link from "next/link";

import { CargoClaimSettlementRecordForm } from "../../../../components/cargo-claim-settlement-record-form";
import { CargoComplianceEvidenceRecordForm } from "../../../../components/cargo-compliance-evidence-record-form";
import { CargoComplianceEvidenceVerifyForm } from "../../../../components/cargo-compliance-evidence-verify-form";
import { CargoDeliveryCompleteForm } from "../../../../components/cargo-delivery-complete-form";
import { CargoDeliveryExceptionRecordForm } from "../../../../components/cargo-delivery-exception-record-form";
import { CargoDeliveryExceptionResolveForm } from "../../../../components/cargo-delivery-exception-resolve-form";
import {
  CargoLifecycleGroup,
  LifecycleProgressIndicator,
} from "../../../../components/cargo-lifecycle-group";
import { CargoOperationalHandoffRecordForm } from "../../../../components/cargo-operational-handoff-record-form";
import { CargoRegisterForm } from "../../../../components/cargo-register-form";
import { CargoReleaseForm } from "../../../../components/cargo-release-form";
import { CargoTransportArriveForm } from "../../../../components/cargo-transport-arrive-form";
import { CargoTransportDepartForm } from "../../../../components/cargo-transport-depart-form";
import { CargoTransportPlanForm } from "../../../../components/cargo-transport-plan-form";
import { requirePlatformSession } from "../../../../lib/auth-session";
import { getCargoOverview } from "../../../../lib/cargo-overview";
import {
  arriveCargoTransportAction,
  completeCargoDeliveryAction,
  departCargoTransportAction,
  planCargoTransportAction,
  recordCargoClaimSettlementAction,
  recordCargoComplianceEvidenceAction,
  recordCargoDeliveryExceptionAction,
  recordCargoOperationalHandoffAction,
  registerCargoAction,
  releaseCargoAction,
  resolveCargoDeliveryExceptionAction,
  verifyCargoComplianceEvidenceAction,
} from "./actions";
import {
  initialCargoClaimSettlementRecordFormState,
  initialCargoComplianceEvidenceRecordFormState,
  initialCargoComplianceEvidenceVerifyFormState,
  initialCargoDeliveryCompleteFormState,
  initialCargoDeliveryExceptionRecordFormState,
  initialCargoDeliveryExceptionResolveFormState,
  initialCargoOperationalHandoffRecordFormState,
  initialCargoRegisterFormState,
  initialCargoReleaseFormState,
  initialCargoTransportArriveFormState,
  initialCargoTransportDepartFormState,
  initialCargoTransportPlanFormState,
} from "./form-state";

export const dynamic = "force-dynamic";

const readCargoPermission: PlatformPermission = "cargo.read";
const registerCargoPermission: PlatformPermission = "cargo.register";
const releaseCargoPermission: PlatformPermission = "cargo.release";
const planCargoTransportPermission: PlatformPermission = "cargo.transport.plan";
const departCargoTransportPermission: PlatformPermission = "cargo.transport.depart";
const arriveCargoTransportPermission: PlatformPermission = "cargo.transport.arrive";
const recordCargoOperationalHandoffPermission: PlatformPermission = "cargo.handoff.record";
const recordCargoClaimSettlementPermission: PlatformPermission = "cargo.claim.settle";
const completeCargoDeliveryPermission: PlatformPermission = "cargo.delivery.complete";
const recordCargoDeliveryExceptionPermission: PlatformPermission =
  "cargo.delivery.exception.record";
const resolveCargoDeliveryExceptionPermission: PlatformPermission =
  "cargo.delivery.exception.resolve";
const recordComplianceEvidencePermission: PlatformPermission = "cargo.compliance.record";
const verifyComplianceEvidencePermission: PlatformPermission = "cargo.compliance.verify";

const cargoStatusLabels = {
  registered: "Registada",
  ready_for_transport: "Pronta",
  in_transport: "Em transporte",
  held: "Bloqueada",
  delivered: "Entregue",
  cancelled: "Cancelada",
} as const;

const cargoTypeLabels = {
  container: "Contentor",
  bulk: "Granel",
  break_bulk: "Carga solta",
  liquid_bulk: "Granel liquido",
  refrigerated: "Refrigerada",
  hazardous: "Perigosa",
  vehicle: "Veiculo",
  other: "Outra",
} as const;

const customsStatusLabels = {
  not_required: "Nao requerido",
  pending: "Pendente",
  cleared: "Liberada",
  held: "Retida",
} as const;

export default async function CargoOverviewPage() {
  const platformSession = await requirePlatformSession("/app/cargo");
  const viewerPermissions = platformSession.viewer.permissions;
  const canRegisterCargo = viewerPermissions.includes(registerCargoPermission);
  const canReleaseCargo = viewerPermissions.includes(releaseCargoPermission);
  const canPlanTransport = viewerPermissions.includes(planCargoTransportPermission);
  const canDepartTransport = viewerPermissions.includes(departCargoTransportPermission);
  const canArriveTransport = viewerPermissions.includes(arriveCargoTransportPermission);
  const canRecordOperationalHandoff = viewerPermissions.includes(
    recordCargoOperationalHandoffPermission,
  );
  const canRecordClaimSettlement = viewerPermissions.includes(recordCargoClaimSettlementPermission);
  const canCompleteDelivery = viewerPermissions.includes(completeCargoDeliveryPermission);
  const canRecordDeliveryException = viewerPermissions.includes(
    recordCargoDeliveryExceptionPermission,
  );
  const canResolveDeliveryException = viewerPermissions.includes(
    resolveCargoDeliveryExceptionPermission,
  );
  const canRecordComplianceEvidence = viewerPermissions.includes(
    recordComplianceEvidencePermission,
  );
  const canVerifyComplianceEvidence = viewerPermissions.includes(
    verifyComplianceEvidencePermission,
  );
  const _canExportReport = viewerPermissions.includes("report.export" as PlatformPermission);

  if (!viewerPermissions.includes(readCargoPermission)) {
    return (
      <CargoAccessState
        message="A sessao esta autenticada, mas falta a permissao cargo.read para abrir o modulo."
        status="Sem grant"
        title="Gestao de cargas bloqueada"
      />
    );
  }

  const result = await getCargoOverview();

  if (result.status !== "ok") {
    return (
      <CargoAccessState
        message={result.message}
        status={result.status}
        title="Gestao de cargas indisponivel"
      />
    );
  }

  const { overview } = result;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* FE-02: Lifecycle Progress Indicator */}
      <LifecycleProgressIndicator cargoStatuses={overview.statusCounts} />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Business P0</Badge>
              <Badge variant="outline">Gestao de Cargas</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-3xl">Registo governado de cargas</CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                Cargas sao registadas com identidade unica por tenant, custodia, origem, destino,
                compliance aduaneiro, regras de perigosidade, bloqueios de movimento, audit trail e
                outbox. Nao existe CRUD generico nesta fatia.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <MetricTile label="Cargas" value={overview.totals.cargo.toString()} />
            <MetricTile label="Ativas" value={overview.totals.activeCargo.toString()} />
            <MetricTile label="Bloqueadas" value={overview.totals.heldCargo.toString()} />
            <MetricTile label="Perigosas" value={overview.totals.hazardousCargo.toString()} />
            <MetricTile
              label="Inspecao"
              value={overview.totals.inspectionRequiredCargo.toString()}
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
            <ContextRow label="Leitura" value={readCargoPermission} />
            <ContextRow label="Registo" value={registerCargoPermission} />
            <ContextRow label="Partida" value={departCargoTransportPermission} />
            <ContextRow label="Handoff" value={recordCargoOperationalHandoffPermission} />
            <ContextRow label="Claims" value={recordCargoClaimSettlementPermission} />
            <ContextRow label="Chegada" value={arriveCargoTransportPermission} />
            <ContextRow label="Entrega" value={completeCargoDeliveryPermission} />
            <ContextRow label="Excecao" value={recordCargoDeliveryExceptionPermission} />
            <ContextRow label="Compliance" value={recordComplianceEvidencePermission} />
            {/* FE-08: Inline audit link */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/app/audit?action=cargo.&subjectType=cargo&limit=25` as Route}>
                  Auditoria de cargas
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={"/app/reports" as Route}>Relatorios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Distribuicao por estado</CardTitle>
            <CardDescription>Base para bloqueio, prontidao, transporte e entrega.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.statusCounts.map((item) => (
                  <TableRow key={item.status}>
                    <TableCell className="font-medium">{cargoStatusLabels[item.status]}</TableCell>
                    <TableCell>
                      <Badge variant={item.count > 0 ? "secondary" : "outline"}>{item.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cargas recentes</CardTitle>
            <CardDescription>
              Registos tenant-scoped com compliance, condicao, custodia e bloqueios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Bloqueios</TableHead>
                  {/* FE-03: Next Action column */}
                  <TableHead>Prox. acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentCargo.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={6}>
                      Sem cargas registadas neste tenant.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recentCargo.map((cargo) => {
                    const nextAction = computeNextCargoAction(cargo);
                    return (
                      <TableRow key={cargo.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span>{cargo.cargoReference}</span>
                            <span className="text-muted-foreground text-xs">
                              {cargo.cargoDescription}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{cargoTypeLabels[cargo.cargoType]}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {cargo.originName} -&gt; {cargo.destinationName}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cargo.customsStatus === "held" ? "warning" : "outline"}>
                            {customsStatusLabels[cargo.customsStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={resolveCargoStatusVariant(cargo.status)}>
                              {cargoStatusLabels[cargo.status]}
                            </Badge>
                            {cargo.requiresInspection ? (
                              <Badge variant="warning">Inspecao</Badge>
                            ) : null}
                            {cargo.hazardous ? <Badge variant="destructive">Perigosa</Badge> : null}
                          </div>
                        </TableCell>
                        {/* FE-03: Next Action cell */}
                        <TableCell>
                          <NextActionCell action={nextAction} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* FE-02: Pre-Transport Stage */}
      <CargoLifecycleGroup
        badge="cargo.register, cargo.release, cargo.compliance"
        description="Registo, compliance aduaneiro, evidencias documentais e liberacao para transporte. Toda acao e governada por RBAC, idempotencia e audit trail."
        stage="pre-transport"
        title="Pre-Transporte"
      >
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CargoRegisterForm
            action={registerCargoAction}
            canRegisterCargo={canRegisterCargo}
            initialState={initialCargoRegisterFormState}
          />

          <Card id="cargo-business-rules">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P0</Badge>
                <Badge variant={canRegisterCargo ? "success" : "warning"}>
                  {canRegisterCargo ? "Pode registar" : "Somente leitura"}
                </Badge>
              </div>
              <CardTitle>Modelo de negocio aplicado</CardTitle>
              <CardDescription>
                As regras sao aplicadas no contrato RPC e novamente no backend. A UI apenas envia o
                comando governado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ContextRow label="Identidade" value="cargoReference unico por tenant" />
              <ContextRow label="Idempotencia" value="registrationIdempotencyKey obrigatoria" />
              <ContextRow label="Perigosidade" value="UN number + hazard class" />
              <ContextRow label="Aduana" value="held exige customs reference" />
              <ContextRow label="Danos" value="damaged exige inspecao" />
              <ContextRow label="Transporte" value="bloqueado ate release governado" />
              <ContextRow label="Operacao" value="cargo.register" />
              <ContextRow label="Transporte RPC" value="POST /rpc/cargo/register" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" id="cargo-release">
          <CargoReleaseForm
            action={releaseCargoAction}
            canReleaseCargo={canReleaseCargo}
            initialState={initialCargoReleaseFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P1</Badge>
                <Badge variant={canReleaseCargo ? "success" : "warning"}>
                  {canReleaseCargo ? "Pode liberar" : "Sem cargo.release"}
                </Badge>
              </div>
              <CardTitle>Liberacao governada</CardTitle>
              <CardDescription>
                Carga so entra em ready_for_transport depois das regras criticas passarem no
                backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ContextRow label="Estado" value="registered/held sao liberaveis" />
              <ContextRow label="Aduana" value="pending/held exigem cleared" />
              <ContextRow label="Inspecao" value="danos/bloqueios exigem passed" />
              <ContextRow label="Perigosa" value="UN number + hazard class obrigatorios" />
              <ContextRow label="Idempotencia" value="releaseIdempotencyKey obrigatoria" />
              <ContextRow label="Operacao" value="cargo.release" />
              <ContextRow label="Transporte RPC" value="POST /rpc/cargo/release" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2" id="cargo-compliance-evidence">
          <CargoComplianceEvidenceRecordForm
            action={recordCargoComplianceEvidenceAction}
            canRecordComplianceEvidence={canRecordComplianceEvidence}
            initialState={initialCargoComplianceEvidenceRecordFormState}
          />

          <CargoComplianceEvidenceVerifyForm
            action={verifyCargoComplianceEvidenceAction}
            canVerifyComplianceEvidence={canVerifyComplianceEvidence}
            initialState={initialCargoComplianceEvidenceVerifyFormState}
          />
        </section>
      </CargoLifecycleGroup>

      {/* FE-02: In-Transit Stage */}
      <CargoLifecycleGroup
        badge="cargo.transport.plan, cargo.transport.depart, cargo.handoff.record"
        description="Planeamento de tracking, partida operacional e transferencias de custodia entre modais."
        stage="in-transit"
        title="Em Transito"
      >
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" id="cargo-transport-plan">
          <CargoTransportPlanForm
            action={planCargoTransportAction}
            canPlanTransport={canPlanTransport}
            initialState={initialCargoTransportPlanFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P2</Badge>
                <Badge variant={canPlanTransport ? "success" : "warning"}>
                  {canPlanTransport ? "Pode criar tracking" : "Sem cargo.transport.plan"}
                </Badge>
              </div>
              <CardTitle>Cargo para Tracking</CardTitle>
              <CardDescription>
                A ligacao cria shipment planeado no Operational Tracking sem CRUD e sem bypass de
                seguranca.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ContextRow label="Prontidao" value="cargo status ready_for_transport" />
              <ContextRow label="Release" value="releasedAt + releaseIdempotencyKey exigidos" />
              <ContextRow label="Bloqueios" value="sem inspecao aberta e sem customs hold" />
              <ContextRow label="Tracking" value="um shipment por carga" />
              <ContextRow label="Evento inicial" value="tracking.created auditavel" />
              <ContextRow label="Operacao" value="cargo.transport.plan" />
              <ContextRow label="Transporte RPC" value="POST /rpc/cargo/planTransport" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CargoTransportDepartForm
            action={departCargoTransportAction}
            canDepartTransport={canDepartTransport}
            initialState={initialCargoTransportDepartFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P4</Badge>
                <Badge variant={canDepartTransport ? "success" : "warning"}>
                  {canDepartTransport ? "Pode iniciar partida" : "Sem cargo.transport.depart"}
                </Badge>
              </div>
              <CardTitle>Departure Lifecycle</CardTitle>
              <CardDescription>
                Partida operacional exige cadeia completa: release, tracking planeado e compliance
                aprovado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <ContextRow label="Cargo" value="status ready_for_transport" />
              <ContextRow label="Tracking" value="shipment ainda planned" />
              <ContextRow label="Compliance" value=">= 1 evidencia approved" />
              <ContextRow label="Bloqueios" value="sem pending_review ou rejected" />
              <ContextRow label="Evento" value="tracking.departed + in_transit" />
              <ContextRow label="Transporte RPC" value="POST /rpc/cargo/departTransport" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CargoOperationalHandoffRecordForm
            action={recordCargoOperationalHandoffAction}
            canRecordOperationalHandoff={canRecordOperationalHandoff}
            initialState={initialCargoOperationalHandoffRecordFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P7</Badge>
                <Badge variant={canRecordOperationalHandoff ? "success" : "warning"}>
                  {canRecordOperationalHandoff
                    ? "Pode registar handoff"
                    : "Sem cargo.handoff.record"}
                </Badge>
              </div>
              <CardTitle>Port/Rail Operational Handoff</CardTitle>
              <CardDescription>
                Transfere custodia entre ferrovia, porto, terminal ou carrier sem fechar o
                transporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <ContextRow label="Cargo" value="status in_transport" />
              <ContextRow label="Tracking" value="shipment in_transit" />
              <ContextRow label="Custodia" value="from deve bater com owner atual" />
              <ContextRow label="Transferencia" value="to deve ser diferente de from" />
              <ContextRow label="Condicao" value="sound; excecoes usam fluxo proprio" />
              <ContextRow label="Evento" value="tracking.location_updated" />
              <ContextRow label="Audit" value="cargo.operational_handoff.recorded" />
              <ContextRow label="RPC" value="POST /rpc/cargo/recordOperationalHandoff" />
            </CardContent>
          </Card>
        </section>
      </CargoLifecycleGroup>

      {/* FE-02: Delivery Stage */}
      <CargoLifecycleGroup
        badge="cargo.transport.arrive, cargo.delivery.complete, cargo.delivery.exception"
        description="Confirmacao de chegada, conclusao de entrega e gestao de excecoes de condicao ou documentacao."
        stage="delivery"
        title="Entrega"
      >
        <section className="grid gap-4 xl:grid-cols-2">
          <CargoTransportArriveForm
            action={arriveCargoTransportAction}
            canArriveTransport={canArriveTransport}
            initialState={initialCargoTransportArriveFormState}
          />

          <CargoDeliveryCompleteForm
            action={completeCargoDeliveryAction}
            canCompleteDelivery={canCompleteDelivery}
            initialState={initialCargoDeliveryCompleteFormState}
          />
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P5</Badge>
                <Badge variant={canArriveTransport ? "success" : "warning"}>
                  {canArriveTransport ? "Pode confirmar chegada" : "Sem cargo.transport.arrive"}
                </Badge>
                <Badge variant={canCompleteDelivery ? "success" : "warning"}>
                  {canCompleteDelivery ? "Pode concluir entrega" : "Sem cargo.delivery.complete"}
                </Badge>
              </div>
              <CardTitle>Arrival & Delivery Lifecycle</CardTitle>
              <CardDescription>
                Fecha o fluxo operacional sem CRUD: arrived no tracking, depois delivered/completed
                com handover auditavel.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <ContextRow label="Chegada" value="cargo in_transport + shipment in_transit" />
              <ContextRow label="Timestamp" value="arrival >= departure" />
              <ContextRow label="Entrega" value="cargo arrived + shipment arrived" />
              <ContextRow label="Condicao" value="sound; danos exigem excecao antes do fecho" />
              <ContextRow label="Eventos" value="tracking.arrived + handover_completed" />
              <ContextRow
                label="Transporte RPC"
                value="/cargo/arriveTransport + /completeDelivery"
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <CargoDeliveryExceptionRecordForm
            action={recordCargoDeliveryExceptionAction}
            canRecordDeliveryException={canRecordDeliveryException}
            initialState={initialCargoDeliveryExceptionRecordFormState}
          />

          <CargoDeliveryExceptionResolveForm
            action={resolveCargoDeliveryExceptionAction}
            canResolveDeliveryException={canResolveDeliveryException}
            initialState={initialCargoDeliveryExceptionResolveFormState}
          />
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P6</Badge>
                <Badge variant={canRecordDeliveryException ? "success" : "warning"}>
                  {canRecordDeliveryException
                    ? "Pode abrir excecao"
                    : "Sem cargo.delivery.exception.record"}
                </Badge>
                <Badge variant={canResolveDeliveryException ? "success" : "warning"}>
                  {canResolveDeliveryException
                    ? "Pode resolver excecao"
                    : "Sem cargo.delivery.exception.resolve"}
                </Badge>
              </div>
              <CardTitle>Delivery Exception Lifecycle</CardTitle>
              <CardDescription>
                Captura dano, falta, temperatura, documentacao ou selo violado sem concluir a
                entrega indevidamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <ContextRow label="Entrada" value="cargo arrived + shipment arrived" />
              <ContextRow label="Bloqueio" value="cargo held + shipment exception" />
              <ContextRow label="Evidencia" value="reportedBy + evidenceReference obrigatorios" />
              <ContextRow label="Resolucao" value="restaura condition sound" />
              <ContextRow label="Retorno" value="shipment arrived para concluir entrega" />
              <ContextRow label="RPC" value="/cargo/recordDeliveryException" />
            </CardContent>
          </Card>
        </section>
      </CargoLifecycleGroup>

      {/* FE-02: Completed Stage */}
      <CargoLifecycleGroup
        badge="cargo.claim.settle"
        description="Liquidacao contabilistica de claims aceites apos resolucao de excecao."
        stage="completed"
        title="Concluido"
      >
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CargoClaimSettlementRecordForm
            action={recordCargoClaimSettlementAction}
            canRecordClaimSettlement={canRecordClaimSettlement}
            initialState={initialCargoClaimSettlementRecordFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Regras P8</Badge>
                <Badge variant={canRecordClaimSettlement ? "success" : "warning"}>
                  {canRecordClaimSettlement ? "Pode liquidar claim" : "Sem cargo.claim.settle"}
                </Badge>
              </div>
              <CardTitle>Claims Settlement Accounting</CardTitle>
              <CardDescription>
                Regista o impacto contabilistico de claims aceites sem alterar tracking ou fechar
                fluxos operacionais fora de ordem.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <ContextRow label="Entrada" value="delivery exception resolved" />
              <ContextRow label="Claim" value="claimReference obrigatoria e coincidente" />
              <ContextRow label="Resolucao" value="resolutionCode claim_accepted" />
              <ContextRow label="Tempo" value="settledAt >= resolvedAt" />
              <ContextRow label="Duplicidade" value="um settlement por exception/reference" />
              <ContextRow label="RPC" value="POST /rpc/cargo/recordClaimSettlement" />
            </CardContent>
          </Card>
        </section>
      </CargoLifecycleGroup>

      {/* Compliance evidence section kept outside lifecycle groups since it spans multiple stages */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Regras P3</Badge>
              <Badge variant={canRecordComplianceEvidence ? "success" : "warning"}>
                {canRecordComplianceEvidence ? "Pode registar evidencia" : "Sem record grant"}
              </Badge>
              <Badge variant={canVerifyComplianceEvidence ? "success" : "warning"}>
                {canVerifyComplianceEvidence ? "Pode verificar evidencia" : "Sem verify grant"}
              </Badge>
            </div>
            <CardTitle>Compliance Evidence</CardTitle>
            <CardDescription>
              Evidencias documentais entram primeiro como pending_review e so viram decisao
              operacional apos verificacao auditavel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <ContextRow label="Record" value="tenant-scoped, idempotente e sem duplicidade" />
            <ContextRow label="Verify" value="somente pending_review pode ser revisada" />
            <ContextRow label="Expiracao" value="aprovacao bloqueia evidencia expirada" />
            <ContextRow label="Perigosa" value="hazardous declaration exige carga perigosa" />
            <ContextRow label="Operacao" value="cargo.compliance.evidence.record / verify" />
            <ContextRow label="Transporte RPC" value="POST /rpc/cargo/recordComplianceEvidence" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function CargoAccessState({
  title,
  status,
  message,
}: {
  title: string;
  status: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">{status}</Badge>
            <Badge variant="outline">Gestao de Cargas</Badge>
          </div>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-base leading-7">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Modelo de seguranca aplicado: a feature existe, mas o acesso depende de sessao,
          organizacao resolvida e permissao explicita.
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.14em]">{label}</span>
      <span className="truncate text-2xl font-semibold">{value}</span>
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function resolveCargoStatusVariant(
  status: keyof typeof cargoStatusLabels,
): "info" | "success" | "warning" | "destructive" | "outline" {
  if (status === "held") {
    return "warning";
  }

  if (status === "delivered") {
    return "success";
  }

  if (status === "cancelled") {
    return "destructive";
  }

  if (status === "registered" || status === "ready_for_transport" || status === "in_transport") {
    return "info";
  }

  return "outline";
}

/* FE-03: Compute next action for a cargo */
type NextAction = {
  label: string;
  href: Route | null;
  blocked: boolean;
  blockedReason: string | null;
};

function computeNextCargoAction(cargo: {
  status: string;
  customsStatus: string;
  conditionStatus: string;
  hazardous: boolean;
  requiresInspection: boolean;
  id: string;
}): NextAction {
  if (cargo.status === "cancelled") {
    return { label: "Cancelada", href: null, blocked: true, blockedReason: "Carga foi cancelada." };
  }
  if (cargo.status === "delivered") {
    return { label: "Entregue", href: null, blocked: false, blockedReason: null };
  }
  if (cargo.status === "held") {
    return {
      label: "Resolver excecao",
      href: "/app/cargo#cargo-delivery-exception" as Route,
      blocked: false,
      blockedReason: null,
    };
  }
  if (cargo.status === "in_transport") {
    return {
      label: "Confirmar chegada",
      href: "/app/cargo#cargo-transport-arrive" as Route,
      blocked: false,
      blockedReason: null,
    };
  }
  if (cargo.status === "ready_for_transport") {
    return {
      label: "Criar tracking",
      href: "/app/cargo#cargo-transport-plan" as Route,
      blocked: false,
      blockedReason: null,
    };
  }
  if (cargo.status === "registered") {
    const blocked = cargo.customsStatus === "held" || cargo.requiresInspection;
    const reasons: string[] = [];
    if (cargo.customsStatus === "held") reasons.push("Status aduaneiro retido");
    if (cargo.requiresInspection) reasons.push("Requer inspecao");
    return {
      label: blocked ? "Bloqueada" : "Liberar carga",
      href: blocked ? null : ("/app/cargo#cargo-release" as Route),
      blocked,
      blockedReason: blocked ? reasons.join("; ") : null,
    };
  }
  return { label: "---", href: null, blocked: false, blockedReason: null };
}

function NextActionCell({ action }: { action: NextAction }) {
  if (action.blocked) {
    return (
      <span
        className="group relative inline-flex cursor-help items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-[0.65rem] text-warning"
        title={action.blockedReason ?? undefined}
      >
        <span>Bloqueado</span>
        <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-popover-foreground shadow-md group-hover:block">
          {action.blockedReason}
        </span>
      </span>
    );
  }

  if (action.href === null) {
    return <span className="text-muted-foreground text-xs">{action.label}</span>;
  }

  return (
    <Link
      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[0.65rem] text-primary underline-offset-4 hover:bg-primary/20 hover:underline"
      href={action.href}
    >
      {action.label}
    </Link>
  );
}
