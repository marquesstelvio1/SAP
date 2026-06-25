import { type TariffOverviewOutput, tariffOverviewOutputSchema } from "@saptm/rpc/tariff";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type TariffOverviewResult =
  | {
      status: "ok";
      overview: TariffOverviewOutput;
    }
  | RpcFailure;

export async function getTariffOverview(): Promise<TariffOverviewResult> {
  const result = await rpcGet("/rpc/tariff/overview", tariffOverviewOutputSchema);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler tarifas e pricing." }
      : result;
  }

  return { status: "ok", overview: result.data };
}
