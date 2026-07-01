import { type CapacityAdvisoryOutput, capacityAdvisoryOutputSchema } from "@saptm/rpc/capacity";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type CapacityAdvisoryResult =
  | {
      status: "ok";
      advisory: CapacityAdvisoryOutput;
    }
  | RpcFailure;

export async function getCapacityAdvisory(limit = 5): Promise<CapacityAdvisoryResult> {
  const result = await rpcGet("/rpc/capacity/advisory", capacityAdvisoryOutputSchema, {
    searchParams: { limit },
  });

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler advisory de capacidade." }
      : result;
  }

  return { status: "ok", advisory: result.data };
}
