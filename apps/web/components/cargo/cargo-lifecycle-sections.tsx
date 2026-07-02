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
import { CargoTransportArriveForm } from "./cargo-transport-arrive-form";
import { CargoTransportDepartForm } from "./cargo-transport-depart-form";
import { CargoTransportPlanForm } from "./cargo-transport-plan-form";

export type CargoLifecycleSectionsProps = {
  canRegisterCargo: boolean;
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
        badge="Registo, liberacao e compliance"
        description="Registo, compliance aduaneiro, evidencias documentais e liberacao para transporte."
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
                <Badge variant={props.canRegisterCargo ? "success" : "warning"}>
                  {props.canRegisterCargo ? "Registo autorizado" : "Registo indisponivel"}
                </Badge>
              </div>
              <CardTitle>Modelo de negocio aplicado</CardTitle>
              <CardDescription>Regras de negocio aplicadas no registo da carga.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
<ContextRow label="Identidade" value="Referencia unica por organizacao" />
<ContextRow label="Idempotencia" value="Chave obrigatoria" />
<ContextRow label="Perigosidade" value="Numero UN + classe de perigo" />
<ContextRow label="Aduana" value="Retencao exige referencia aduaneira" />
<ContextRow label="Danos" value="Carga danificada exige inspecao" />
<ContextRow label="Transporte" value="Bloqueado ate libertacao" />
<ContextRow label="Libertacao" value="Disponivel no formulario de registo" />
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
        badge="Planeamento, partida e transferencias"
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
                <Badge variant={props.canPlanTransport ? "success" : "warning"}>
                  {props.canPlanTransport ? "Planeamento autorizado" : "Planeamento indisponivel"}
                </Badge>
              </div>
              <CardTitle>Cargo para Tracking</CardTitle>
              <CardDescription>Cria o registo de tracking para a carga planeada.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
<ContextRow label="Prontidao" value="Carga pronta para transporte" />
<ContextRow label="Libertacao" value="Carga libertada" />
<ContextRow label="Bloqueios" value="Sem inspecao aberta e sem retencao aduaneira" />
<ContextRow label="Tracking" value="Um registo por carga" />
<ContextRow label="Evento inicial" value="Criado" />
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
                <Badge variant={props.canDepartTransport ? "success" : "warning"}>
                  {props.canDepartTransport ? "Partida autorizada" : "Partida indisponivel"}
                </Badge>
              </div>
              <CardTitle>Partida operacional</CardTitle>
              <CardDescription>
                Partida exige cadeia completa: release, tracking planeado e compliance aprovado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
<ContextRow label="Cargo" value="Pronto para transporte" />
<ContextRow label="Tracking" value="Registo planeado" />
<ContextRow label="Compliance" value="Pelo menos 1 evidencia aprovada" />
<ContextRow label="Bloqueios" value="Sem revisao pendente ou rejeitada" />
<ContextRow label="Evento" value="Partida + em transito" />
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
                <Badge variant={props.canRecordOperationalHandoff ? "success" : "warning"}>
                  {props.canRecordOperationalHandoff
                    ? "Handoff autorizado"
                    : "Handoff indisponivel"}
                </Badge>
              </div>
              <CardTitle>Transferencia operacional</CardTitle>
              <CardDescription>
                Transfere custodia entre ferrovia, porto, terminal ou carrier sem fechar o
                transporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
<ContextRow label="Cargo" value="Em transporte" />
<ContextRow label="Tracking" value="Registo em transito" />
<ContextRow label="Custodia" value="Origem deve corresponder a custodia atual" />
<ContextRow label="Transferencia" value="Destino deve ser diferente de origem" />
<ContextRow label="Condicao" value="Integra; excecoes tem fluxo proprio" />
<ContextRow label="Evento" value="Localizacao atualizada" />
            </CardContent>
          </Card>
        </section>
      </CargoLifecycleGroup>

      {/* Delivery Stage */}
      <CargoLifecycleGroup
        badge="Chegada, entrega e excecoes"
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
                <Badge variant={props.canArriveTransport ? "success" : "warning"}>
                  {props.canArriveTransport ? "Chegada autorizada" : "Chegada indisponivel"}
                </Badge>
                <Badge variant={props.canCompleteDelivery ? "success" : "warning"}>
                  {props.canCompleteDelivery ? "Entrega autorizada" : "Entrega indisponivel"}
                </Badge>
              </div>
              <CardTitle>Chegada e entrega</CardTitle>
              <CardDescription>
                Confirma a chegada e conclui a entrega com registo de auditoria.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
<ContextRow label="Chegada" value="Carga em transporte + tracking em transito" />
<ContextRow label="Timestamp" value="Chegada posterior a partida" />
<ContextRow label="Entrega" value="Carga chegada + tracking chegada" />
<ContextRow label="Condicao" value="Integra; danos exigem excecao antes do fecho" />
<ContextRow label="Eventos" value="Chegada + transferencia concluida" />
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
                <Badge variant={props.canRecordDeliveryException ? "success" : "warning"}>
                  {props.canRecordDeliveryException ? "Excecao autorizada" : "Excecao indisponivel"}
                </Badge>
                <Badge variant={props.canResolveDeliveryException ? "success" : "warning"}>
                  {props.canResolveDeliveryException
                    ? "Resolucao autorizada"
                    : "Resolucao indisponivel"}
                </Badge>
              </div>
              <CardTitle>Excecao de entrega</CardTitle>
              <CardDescription>
                Captura dano, falta, temperatura, documentacao ou selo violado sem concluir a
                entrega indevidamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <ContextRow label="Entrada" value="cargo arrived + tracking arrived" />
              <ContextRow label="Bloqueio" value="cargo held + tracking exception" />
              <ContextRow label="Evidencia" value="reportadoPor + referencia de evidencia" />
              <ContextRow label="Resolucao" value="restaura condicao sound" />
              <ContextRow label="Retorno" value="tracking arrived para concluir entrega" />
            </CardContent>
          </Card>
        </section>
      </CargoLifecycleGroup>

      {/* Completed Stage */}
      <CargoLifecycleGroup
        badge="Liquidacao de claims"
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
                <Badge variant={props.canRecordClaimSettlement ? "success" : "warning"}>
                  {props.canRecordClaimSettlement
                    ? "Liquidacao autorizada"
                    : "Liquidacao indisponivel"}
                </Badge>
              </div>
              <CardTitle>Liquidacao de claims</CardTitle>
              <CardDescription>Regista o impacto contabilistico de claims aceites.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <ContextRow label="Entrada" value="excecao de entrega resolvida" />
              <ContextRow label="Claim" value="claimReference obrigatoria e coincidente" />
              <ContextRow label="Resolucao" value="resolutionCode claim_accepted" />
              <ContextRow label="Tempo" value="liquidacao >= resolucao" />
              <ContextRow label="Duplicidade" value="um registo por excecao/reference" />
            </CardContent>
          </Card>
        </section>
      </CargoLifecycleGroup>

      {/* Compliance evidence */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant={props.canRecordComplianceEvidence ? "success" : "warning"}>
                {props.canRecordComplianceEvidence ? "Registo autorizado" : "Registo indisponivel"}
              </Badge>
              <Badge variant={props.canVerifyComplianceEvidence ? "success" : "warning"}>
                {props.canVerifyComplianceEvidence
                  ? "Verificacao autorizada"
                  : "Verificacao indisponivel"}
              </Badge>
            </div>
            <CardTitle>Evidencias de compliance</CardTitle>
            <CardDescription>
              Evidencias documentais entram como revisao pendente e sao decididas apos verificacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <ContextRow label="Registo" value="sem duplicidade por tenant" />
            <ContextRow label="Verificacao" value="so pode rever registos pendentes" />
            <ContextRow label="Expiracao" value="aprovacao bloqueada se expirada" />
            <ContextRow label="Perigosa" value="declaracao hazardous exige carga perigosa" />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
