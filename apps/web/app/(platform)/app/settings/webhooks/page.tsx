import { webhookEndpointSummarySchema } from "@saptm/rpc/webhooks";
import { AccessState } from "@saptm/ui";
import type { Metadata } from "next";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { rpcGet } from "../../../../../lib/rpc-server";
import { WebhooksSettingsContent } from "./webhooks-settings-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Webhooks",
  description: "Gestão de notificações externas via webhooks da organização.",
};

export default async function WebhooksSettingsPage(props: {
  searchParams?: Promise<{ offset?: string; limit?: string }>;
}) {
  const searchParams = await props.searchParams;
  const offset = Number(searchParams?.offset) || 0;
  const limit = Number(searchParams?.limit) || 25;

  const platformSession = await requirePlatformSession("/app/settings/webhooks");
  const canManage = platformSession.viewer.permissions.includes("tenant.manage");

  if (!canManage) {
    return (
      <AccessState
        badgeLabel="Notificações"
        description="O utilizador autenticado não tem acesso à gestão de notificações externas."
        role="alert"
        title="Notificações bloqueadas"
        variant="blocked"
      />
    );
  }

  const result = await rpcGet("/rpc/webhooks/list", webhookEndpointSummarySchema.array(), {
    searchParams: { limit, offset },
  }).catch(() => ({
    status: "unavailable" as const,
    message: "API não respondeu dentro do tempo limite.",
  }));

  if (result.status !== "ok") {
    return (
      <AccessState
        badgeLabel="Webhooks"
        description={result.message}
        role="alert"
        title="Webhooks indisponiveis"
        variant="error"
      />
    );
  }

  return <WebhooksSettingsContent initialData={result.data} canManage={canManage} />;
}
