import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";

import { requirePlatformSession } from "../../../../lib/auth-session";
import { CargoOverviewClient } from "./CargoOverviewClient";

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

export default async function CargoOverviewPage(props: {
  searchParams?: Promise<{ offset?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const offset = Number(searchParams?.offset) || 0;
  const limit = Number(searchParams?.limit) || 10;
  const platformSession = await requirePlatformSession("/app/cargo");
  const viewerPermissions = platformSession.viewer.permissions;

  if (!viewerPermissions.includes(readCargoPermission)) {
    return (
      <AccessState
        badgeLabel="Gestao de Cargas"
        message="A sessao esta autenticada, mas falta a permissao cargo.read para abrir o modulo."
        role="alert"
        status="Sem grant"
        title="Gestao de cargas bloqueada"
      />
    );
  }

  return (
    <CargoOverviewClient
      offset={offset}
      limit={limit}
      sessionId={platformSession.sessionId}
      canRegisterCargo={viewerPermissions.includes(registerCargoPermission)}
      canReleaseCargo={viewerPermissions.includes(releaseCargoPermission)}
      canPlanTransport={viewerPermissions.includes(planCargoTransportPermission)}
      canDepartTransport={viewerPermissions.includes(departCargoTransportPermission)}
      canArriveTransport={viewerPermissions.includes(arriveCargoTransportPermission)}
      canRecordOperationalHandoff={viewerPermissions.includes(
        recordCargoOperationalHandoffPermission,
      )}
      canRecordClaimSettlement={viewerPermissions.includes(recordCargoClaimSettlementPermission)}
      canCompleteDelivery={viewerPermissions.includes(completeCargoDeliveryPermission)}
      canRecordDeliveryException={viewerPermissions.includes(
        recordCargoDeliveryExceptionPermission,
      )}
      canResolveDeliveryException={viewerPermissions.includes(
        resolveCargoDeliveryExceptionPermission,
      )}
      canRecordComplianceEvidence={viewerPermissions.includes(recordComplianceEvidencePermission)}
      canVerifyComplianceEvidence={viewerPermissions.includes(verifyComplianceEvidencePermission)}
    />
  );
}
