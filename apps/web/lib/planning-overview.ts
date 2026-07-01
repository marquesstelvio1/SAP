import { type PlanningOverviewOutput, planningOverviewOutputSchema } from "@saptm/rpc/planning";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type PlanningOverviewResult =
  | {
      status: "ok";
      overview: PlanningOverviewOutput;
    }
  | RpcFailure;

export async function getPlanningOverview(limit = 10): Promise<PlanningOverviewResult> {
  const result = await rpcGet("/rpc/planning/overview", planningOverviewOutputSchema, {
    searchParams: { limit },
  });

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler planeamento operacional." }
      : result;
  }

  return { status: "ok", overview: result.data };
}
