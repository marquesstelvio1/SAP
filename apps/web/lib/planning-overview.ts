import { getClientEnv } from "@saptm/config";
import { type PlanningOverviewOutput, planningOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type PlanningOverviewResult =
  | {
      status: "ok";
      overview: PlanningOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getPlanningOverview(limit = 10): Promise<PlanningOverviewResult> {
  const url = new URL("/rpc/planning/overview", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "Sessao sem permissao para ler planeamento operacional.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de planeamento indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = planningOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de planeamento retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
