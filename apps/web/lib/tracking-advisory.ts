import { type TrackingAdvisoryOutput, trackingAdvisoryOutputSchema } from "@saptm/rpc/tracking";

import { type RpcFailure, rpcGet } from "./rpc-client";

export type TrackingAdvisoryResult =
  | {
      status: "ok";
      advisory: TrackingAdvisoryOutput;
    }
  | RpcFailure;

export async function getTrackingAdvisory(limit = 5): Promise<TrackingAdvisoryResult> {
  const result = await rpcGet("/rpc/tracking/advisory", trackingAdvisoryOutputSchema, {
    searchParams: { limit },
  });

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler advisory operacional." }
      : result;
  }

  return { status: "ok", advisory: result.data };
}
