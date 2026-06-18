import { getClientEnv } from "@saptm/config";
import { type TariffOverviewOutput, tariffOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type TariffOverviewResult =
  | {
      status: "ok";
      overview: TariffOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getTariffOverview(): Promise<TariffOverviewResult> {
  const url = new URL("/rpc/tariff/overview", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler tarifas e pricing.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de tarifas indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = tariffOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de tarifas retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
