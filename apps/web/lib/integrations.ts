import { type IntegrationOverviewOutput, integrationOverviewOutputSchema } from "@saptm/rpc/integrations";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type IntegrationOverviewResult =
  | {
      status: "ok";
      overview: IntegrationOverviewOutput;
    }
  | RpcFailure;

export async function getIntegrationOverview(): Promise<IntegrationOverviewResult> {
  const result = await rpcGet("/rpc/integrations/overview", integrationOverviewOutputSchema);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler o gateway de integracoes." }
      : result;
  }

  return { status: "ok", overview: result.data };
}
