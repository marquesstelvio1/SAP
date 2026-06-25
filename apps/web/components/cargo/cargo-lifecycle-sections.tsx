import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContextRow,
} from "@saptm/ui";
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
} from "../../app/(platform)/app/cargo/actions";
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
} from "../../app/(platform)/app/cargo/form-state";
import { CargoClaimSettlementRecordForm } from "./cargo-claim-settlement-record-form";
import { CargoComplianceEvidenceRecordForm } from "./cargo-compliance-evidence-record-form";
import { CargoComplianceEvidenceVerifyForm } from "./cargo-compliance-evidence-verify-form";
import { CargoDeliveryCompleteForm } from "./cargo-delivery-complete-form";
import { CargoDeliveryExceptionRecordForm } from "./cargo-delivery-exception-record-form";
import { CargoDeliveryExceptionResolveForm } from "./cargo-delivery-exception-resolve-form";
import { CargoLifecycleGroup } from "./cargo-lifecycle-group";
import { CargoOperationalHandoffRecordForm } from "./cargo-operational-handoff-record-form";
import { CargoRegisterForm } from "./cargo-register-form";
import { CargoReleaseForm } from "./cargo-release-form";
import { CargoTransportArriveForm } from "./cargo-transport-arrive-form";
import { CargoTransportDepartForm } from "./cargo-transport-depart-form";
import { CargoTransportPlanForm } from "./cargo-transport-plan-form";

export type CargoLifecycleSectionsProps = {
  canRegisterCargo: boolean;
  canReleaseCargo: boolean;
  canPlanTransport: boolean;
  canDepartTransport: boolean;
  canArriveTransport: boolean;
  canRecordOperationalHandoff: boolean;
  canRecordClaimSettlement: boolean;
  canCompleteDelivery: boolean;
  canRecordDeliveryException: boolean;
  canResolveDeliveryException: boolean;
  canRecordComplianceEvidence: boolean;
  canVerifyComplianceEvidence: boolean;
};

export function CargoLifecycleSections(props: CargoLifecycleSectionsProps) {
  return (
    <>
      {/* Pre-Transport Stage */}
      <CargoLifecycleGroup
        badge="cargo.register, cargo.release, cargo.compliance"
        description="Registo, compliance aduaneiro, evidencias documentais e liberacao para transporte. Toda acao e governada por RBAC, idempotencia e audit trail."
        stage="pre-transport"
        title="Pre-Transporte"
      >
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CargoRegisterForm
            action={registerCargoAction}
            canRegisterCargo={props.canRegisterCargo}
            initialState={initialCargoRegisterFormState}
          />

          <Card id="cargo-business-rules">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P0</Badge>
                <Badge variant={props.canRegisterCargo ? "success" : "warning"}>
                  {props.canRegisterCargo ? "Pode registar" : "Somente leitura"}
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
            canReleaseCargo={props.canReleaseCargo}
            initialState={initialCargoReleaseFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P1</Badge>
                <Badge variant={props.canReleaseCargo ? "success" : "warning"}>
                  {props.canReleaseCargo ? "Pode liberar" : "Sem cargo.release"}
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
            canRecordComplianceEvidence={props.canRecordComplianceEvidence}
            initialState={initialCargoComplianceEvidenceRecordFormState}
          />

          <CargoComplianceEvidenceVerifyForm
            action={verifyCargoComplianceEvidenceAction}
            canVerifyComplianceEvidence={props.canVerifyComplianceEvidence}
            initialState={initialCargoComplianceEvidenceVerifyFormState}
          />
        </section>
      </CargoLifecycleGroup>

      {/* In-Transit Stage */}
      <CargoLifecycleGroup
        badge="cargo.transport.plan, cargo.transport.depart, cargo.handoff.record"
        description="Planeamento de tracking, partida operacional e transferencias de custodia entre modais."
        stage="in-transit"
        title="Em Transito"
      >
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" id="cargo-transport-plan">
          <CargoTransportPlanForm
            action={planCargoTransportAction}
            canPlanTransport={props.canPlanTransport}
            initialState={initialCargoTransportPlanFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P2</Badge>
                <Badge variant={props.canPlanTransport ? "success" : "warning"}>
                  {props.canPlanTransport ? "Pode criar tracking" : "Sem cargo.transport.plan"}
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
            canDepartTransport={props.canDepartTransport}
            initialState={initialCargoTransportDepartFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P4</Badge>
                <Badge variant={props.canDepartTransport ? "success" : "warning"}>
                  {props.canDepartTransport ? "Pode iniciar partida" : "Sem cargo.transport.depart"}
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
            canRecordOperationalHandoff={props.canRecordOperationalHandoff}
            initialState={initialCargoOperationalHandoffRecordFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P7</Badge>
                <Badge variant={props.canRecordOperationalHandoff ? "success" : "warning"}>
                  {props.canRecordOperationalHandoff
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

      {/* Delivery Stage */}
      <CargoLifecycleGroup
        badge="cargo.transport.arrive, cargo.delivery.complete, cargo.delivery.exception"
        description="Confirmacao de chegada, conclusao de entrega e gestao de excecoes de condicao ou documentacao."
        stage="delivery"
        title="Entrega"
      >
        <section className="grid gap-4 xl:grid-cols-2">
          <CargoTransportArriveForm
            action={arriveCargoTransportAction}
            canArriveTransport={props.canArriveTransport}
            initialState={initialCargoTransportArriveFormState}
          />

          <CargoDeliveryCompleteForm
            action={completeCargoDeliveryAction}
            canCompleteDelivery={props.canCompleteDelivery}
            initialState={initialCargoDeliveryCompleteFormState}
          />
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P5</Badge>
                <Badge variant={props.canArriveTransport ? "success" : "warning"}>
                  {props.canArriveTransport
                    ? "Pode confirmar chegada"
                    : "Sem cargo.transport.arrive"}
                </Badge>
                <Badge variant={props.canCompleteDelivery ? "success" : "warning"}>
                  {props.canCompleteDelivery
                    ? "Pode concluir entrega"
                    : "Sem cargo.delivery.complete"}
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
            canRecordDeliveryException={props.canRecordDeliveryException}
            initialState={initialCargoDeliveryExceptionRecordFormState}
          />

          <CargoDeliveryExceptionResolveForm
            action={resolveCargoDeliveryExceptionAction}
            canResolveDeliveryException={props.canResolveDeliveryException}
            initialState={initialCargoDeliveryExceptionResolveFormState}
          />
        </section>

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P6</Badge>
                <Badge variant={props.canRecordDeliveryException ? "success" : "warning"}>
                  {props.canRecordDeliveryException
                    ? "Pode abrir excecao"
                    : "Sem cargo.delivery.exception.record"}
                </Badge>
                <Badge variant={props.canResolveDeliveryException ? "success" : "warning"}>
                  {props.canResolveDeliveryException
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

      {/* Completed Stage */}
      <CargoLifecycleGroup
        badge="cargo.claim.settle"
        description="Liquidacao contabilistica de claims aceites apos resolucao de excecao."
        stage="completed"
        title="Concluido"
      >
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CargoClaimSettlementRecordForm
            action={recordCargoClaimSettlementAction}
            canRecordClaimSettlement={props.canRecordClaimSettlement}
            initialState={initialCargoClaimSettlementRecordFormState}
          />

          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Regras P8</Badge>
                <Badge variant={props.canRecordClaimSettlement ? "success" : "warning"}>
                  {props.canRecordClaimSettlement
                    ? "Pode liquidar claim"
                    : "Sem cargo.claim.settle"}
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

      {/* Compliance evidence */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Regras P3</Badge>
              <Badge variant={props.canRecordComplianceEvidence ? "success" : "warning"}>
                {props.canRecordComplianceEvidence ? "Pode registar evidencia" : "Sem record grant"}
              </Badge>
              <Badge variant={props.canVerifyComplianceEvidence ? "success" : "warning"}>
                {props.canVerifyComplianceEvidence
                  ? "Pode verificar evidencia"
                  : "Sem verify grant"}
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
    </>
  );
}
