import { getClientEnv } from "@saptm/config";
import { type CargoOverviewOutput, cargoOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type CargoOverviewResult =
  | {
      status: "ok";
      overview: CargoOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getCargoOverview(): Promise<CargoOverviewResult> {
  const url = new URL("/rpc/cargo/overview", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler gestao de cargas.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de cargas indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = cargoOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de cargas retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
