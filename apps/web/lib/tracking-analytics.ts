import { getClientEnv } from "@saptm/config";
import { type TrackingAnalyticsOutput, trackingAnalyticsOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type TrackingAnalyticsResult =
  | {
      status: "ok";
      analytics: TrackingAnalyticsOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getTrackingAnalytics(lookbackDays = 30): Promise<TrackingAnalyticsResult> {
  const url = new URL("/rpc/tracking/analytics", getClientEnv().NEXT_PUBLIC_API_URL);
  url.searchParams.set("lookbackDays", lookbackDays.toString());

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler analytics operacional.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de analytics operacional indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = trackingAnalyticsOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de analytics operacional retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    analytics: parsed.data,
  };
}
