import { getClientEnv } from "@saptm/config";
import { type TrackingShipmentDetailOutput, trackingShipmentDetailOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type TrackingShipmentDetailResult =
  | {
      status: "ok";
      detail: TrackingShipmentDetailOutput;
    }
  | {
      status: "forbidden" | "not_found" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getTrackingShipmentDetail(
  shipmentId: string,
): Promise<TrackingShipmentDetailResult> {
  const url = new URL("/rpc/tracking/shipmentDetail", getClientEnv().NEXT_PUBLIC_API_URL);
  url.searchParams.set(
    "data",
    JSON.stringify({
      json: {
        shipmentId,
        eventLimit: 50,
      },
    }),
  );

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler o detalhe desta carga.",
    };
  }

  if (response.status === 404) {
    return {
      status: "not_found",
      message: "Carga rastreada nao encontrada para esta organizacao.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de tracking indisponivel para detalhe: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = trackingShipmentDetailOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de detalhe de tracking retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    detail: parsed.data,
  };
}
