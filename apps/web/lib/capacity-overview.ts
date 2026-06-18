import { getClientEnv } from "@saptm/config";
import { type CapacityOverviewOutput, capacityOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type CapacityOverviewResult =
  | {
      status: "ok";
      overview: CapacityOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getCapacityOverview(): Promise<CapacityOverviewResult> {
  const url = new URL("/rpc/capacity/overview", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler capacidade operacional.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de capacidade indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = capacityOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de capacidade retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
