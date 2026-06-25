import { webhookEndpointSummarySchema } from "@saptm/rpc/webhooks";
import { AccessState } from "@saptm/ui";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import { rpcGet } from "../../../../../lib/rpc-server";
import { WebhooksSettingsContent } from "./webhooks-settings-content";

export const dynamic = "force-dynamic";

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
        badgeLabel="RBAC"
        message="A sessao esta autenticada, mas falta tenant.manage para gerir webhooks."
        role="alert"
        status="Sem grant"
        title="Webhooks bloqueado"
        variant="empty"
      />
    );
  }

  const result = await rpcGet("/rpc/webhooks/list", webhookEndpointSummarySchema.array(), {
    searchParams: { limit, offset },
  });

  return (
    <WebhooksSettingsContent
      initialData={result.status === "ok" ? result.data : []}
      canManage={canManage}
    />
  );
}
