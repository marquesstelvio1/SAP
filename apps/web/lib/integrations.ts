import { getClientEnv } from "@saptm/config";
import { type IntegrationOverviewOutput, integrationOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type IntegrationOverviewResult =
  | {
      status: "ok";
      overview: IntegrationOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getIntegrationOverview(): Promise<IntegrationOverviewResult> {
  const url = new URL("/rpc/integrations/overview", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao para ler o gateway de integracoes.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de integracoes indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = integrationOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de integracoes retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
