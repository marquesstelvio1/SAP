import { type TrackingShipmentDetailOutput, trackingShipmentDetailOutputSchema } from "@saptm/rpc/tracking";

import { type RpcFailure, rpcGet } from "./rpc-client";

export type TrackingShipmentDetailResult =
  | {
      status: "ok";
      detail: TrackingShipmentDetailOutput;
    }
  | RpcFailure;

export async function getTrackingShipmentDetail(
  shipmentId: string,
): Promise<TrackingShipmentDetailResult> {
  const data = JSON.stringify({ json: { shipmentId, eventLimit: 50 } });

  const result = await rpcGet("/rpc/tracking/shipmentDetail", trackingShipmentDetailOutputSchema, {
    searchParams: { data },
  });

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? { status: "forbidden", message: "Sessao sem permissao para ler o detalhe desta carga." }
      : result.status === "not_found"
        ? { status: "not_found", message: "Carga rastreada nao encontrada para esta organizacao." }
        : result;
  }

  return { status: "ok", detail: result.data };
}
