import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";

import { requirePlatformSession } from "../../../../lib/auth-session";
import { CargoOverviewClient } from "./CargoOverviewClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cargas",
  description:
    "Gestão de cargas ferroviárias, portuárias e logísticas — registo, transporte, entrega e compliance.",
};

const readCargoPermission: PlatformPermission = "cargo.read";
const registerCargoPermission: PlatformPermission = "cargo.register";
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
        badgeLabel="Gestão de Cargas"
        description="O utilizador autenticado não tem acesso ao módulo de gestão de cargas."
        role="alert"
        title="Gestão de cargas bloqueada"
        variant="blocked"
      />
    );
  }

  return (
    <CargoOverviewClient
      offset={offset}
      limit={limit}
      canRegisterCargo={viewerPermissions.includes(registerCargoPermission)}
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
