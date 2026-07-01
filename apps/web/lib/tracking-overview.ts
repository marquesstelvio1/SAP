import { type TrackingOverviewOutput, trackingOverviewOutputSchema } from "@saptm/rpc/tracking";

import { type RpcFailure, rpcGet } from "./rpc-client";

export type TrackingOverviewResult =
  | {
      status: "ok";
      overview: TrackingOverviewOutput;
    }
  | RpcFailure;

export async function getTrackingOverview(options?: {
  offset?: number;
  limit?: number;
}): Promise<TrackingOverviewResult> {
  const result = await rpcGet(
    "/rpc/tracking/overview",
    trackingOverviewOutputSchema,
    options === undefined ? {} : { searchParams: options },
  );

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler tracking operacional." }
      : result;
  }

  return { status: "ok", overview: result.data };
}
