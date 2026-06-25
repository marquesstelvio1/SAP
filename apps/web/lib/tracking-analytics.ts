import { type TrackingAnalyticsOutput, trackingAnalyticsOutputSchema } from "@saptm/rpc/tracking";

import { type RpcFailure, rpcGet } from "./rpc-client";

export type TrackingAnalyticsResult =
  | {
      status: "ok";
      analytics: TrackingAnalyticsOutput;
    }
  | RpcFailure;

export async function getTrackingAnalytics(lookbackDays = 30): Promise<TrackingAnalyticsResult> {
  const result = await rpcGet("/rpc/tracking/analytics", trackingAnalyticsOutputSchema, {
    searchParams: { lookbackDays },
  });

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler analytics operacional." }
      : result;
  }

  return { status: "ok", analytics: result.data };
}
