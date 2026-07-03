import type { PlatformPermission } from "@saptm/auth";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";

import { requirePlatformSession } from "../../../../lib/auth-session";
import { TrackingOverviewClient } from "./TrackingOverviewClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tracking Operacional",
  description: "Acompanhamento de remessas com eventos operacionais, exceções e SLA em tempo real.",
};

const readTrackingPermission: PlatformPermission = "tracking.shipment.read";
const recordTrackingPermission: PlatformPermission = "tracking.event.record";

export default async function TrackingOverviewPage(props: {
  searchParams?: Promise<{ offset?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const offset = Number(searchParams?.offset) || 0;
  const limit = Number(searchParams?.limit) || 10;
  const platformSession = await requirePlatformSession("/app/tracking");
  const viewerPermissions = platformSession.viewer.permissions;
  const canRecordEvents = viewerPermissions.includes(recordTrackingPermission);

  if (!viewerPermissions.includes(readTrackingPermission)) {
    return (
      <AccessState
        badgeLabel="Tracking"
        description="O utilizador autenticado não tem acesso ao modulo de tracking."
        role="alert"
        title="Tracking operacional bloqueado"
        variant="blocked"
      />
    );
  }

  return <TrackingOverviewClient offset={offset} limit={limit} canRecordEvents={canRecordEvents} />;
}
