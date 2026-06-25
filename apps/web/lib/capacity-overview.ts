import { type CapacityOverviewOutput, capacityOverviewOutputSchema } from "@saptm/rpc/capacity";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type CapacityOverviewResult =
  | {
      status: "ok";
      overview: CapacityOverviewOutput;
    }
  | RpcFailure;

export async function getCapacityOverview(): Promise<CapacityOverviewResult> {
  const result = await rpcGet("/rpc/capacity/overview", capacityOverviewOutputSchema);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler capacidade operacional." }
      : result;
  }

  return { status: "ok", overview: result.data };
}
