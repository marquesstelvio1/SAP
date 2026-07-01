import { type CargoOverviewOutput, cargoOverviewOutputSchema } from "@saptm/rpc/cargo";

import { type RpcFailure, rpcGet } from "./rpc-client";

export type CargoOverviewResult =
  | {
      status: "ok";
      overview: CargoOverviewOutput;
    }
  | RpcFailure;

export async function getCargoOverview(options?: {
  offset?: number;
  limit?: number;
}): Promise<CargoOverviewResult> {
  const result = await rpcGet(
    "/rpc/cargo/overview",
    cargoOverviewOutputSchema,
    options === undefined ? {} : { searchParams: options },
  );

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler gestao de cargas." }
      : result;
  }

  return { status: "ok", overview: result.data };
}
