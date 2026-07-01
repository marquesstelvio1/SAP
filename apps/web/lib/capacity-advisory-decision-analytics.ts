import {
  type CapacityAdvisoryDecisionAnalyticsOutput,
  capacityAdvisoryDecisionAnalyticsOutputSchema,
} from "@saptm/rpc/capacity";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type CapacityAdvisoryDecisionAnalyticsResult =
  | {
      status: "ok";
      analytics: CapacityAdvisoryDecisionAnalyticsOutput;
    }
  | RpcFailure;

export async function getCapacityAdvisoryDecisionAnalytics(
  limit = 10,
  windowDays = 30,
): Promise<CapacityAdvisoryDecisionAnalyticsResult> {
  const result = await rpcGet(
    "/rpc/capacity/advisoryDecisionAnalytics",
    capacityAdvisoryDecisionAnalyticsOutputSchema,
    { searchParams: { limit, windowDays } },
  );

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem permissao para ler analytics de decisoes de advisory.",
        }
      : result;
  }

  return { status: "ok", analytics: result.data };
}
