import { getClientEnv } from "@saptm/config";
import {
  type CapacityAdvisoryDecisionAnalyticsOutput,
  capacityAdvisoryDecisionAnalyticsOutputSchema,
} from "@saptm/rpc";
import { headers } from "next/headers";

export type CapacityAdvisoryDecisionAnalyticsResult =
  | {
      status: "ok";
      analytics: CapacityAdvisoryDecisionAnalyticsOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getCapacityAdvisoryDecisionAnalytics(
  limit = 10,
  windowDays = 30,
): Promise<CapacityAdvisoryDecisionAnalyticsResult> {
  const url = new URL(
    "/rpc/capacity/advisoryDecisionAnalytics",
    getClientEnv().NEXT_PUBLIC_API_URL,
  );
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("windowDays", windowDays.toString());

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler analytics de decisoes de advisory.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de analytics de advisory indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = capacityAdvisoryDecisionAnalyticsOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de analytics de advisory retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    analytics: parsed.data,
  };
}
