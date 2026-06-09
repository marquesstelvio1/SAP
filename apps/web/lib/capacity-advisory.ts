import { getClientEnv } from "@saptm/config";
import { type CapacityAdvisoryOutput, capacityAdvisoryOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type CapacityAdvisoryResult =
  | {
      status: "ok";
      advisory: CapacityAdvisoryOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getCapacityAdvisory(limit = 5): Promise<CapacityAdvisoryResult> {
  const url = new URL("/rpc/capacity/advisory", getClientEnv().NEXT_PUBLIC_API_URL);
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
      message: "Sessao sem permissao para ler advisory de capacidade.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de advisory de capacidade indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = capacityAdvisoryOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de advisory de capacidade retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    advisory: parsed.data,
  };
}
