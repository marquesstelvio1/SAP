import { getClientEnv } from "@saptm/config";
import { type TrackingAdvisoryOutput, trackingAdvisoryOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type TrackingAdvisoryResult =
  | {
      status: "ok";
      advisory: TrackingAdvisoryOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getTrackingAdvisory(limit = 5): Promise<TrackingAdvisoryResult> {
  const url = new URL("/rpc/tracking/advisory", getClientEnv().NEXT_PUBLIC_API_URL);
  url.searchParams.set("limit", limit.toString());

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler advisory operacional.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de advisory operacional indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = trackingAdvisoryOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de advisory operacional retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    advisory: parsed.data,
  };
}
