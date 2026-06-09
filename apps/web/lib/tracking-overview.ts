import { getClientEnv } from "@saptm/config";
import { type TrackingOverviewOutput, trackingOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type TrackingOverviewResult =
  | {
      status: "ok";
      overview: TrackingOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getTrackingOverview(): Promise<TrackingOverviewResult> {
  const url = new URL("/rpc/tracking/overview", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler tracking operacional.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de tracking indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = trackingOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de tracking retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
