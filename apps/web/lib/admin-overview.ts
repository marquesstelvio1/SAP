import { getClientEnv } from "@saptm/config";
import { type AdminOverviewOutput, adminOverviewOutputSchema } from "@saptm/rpc";
import { headers } from "next/headers";

export type AdminOverviewResult =
  | {
      status: "ok";
      overview: AdminOverviewOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getAdminOverview(): Promise<AdminOverviewResult> {
  const url = new URL("/rpc/admin/overview", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader === null ? {} : { cookie: cookieHeader },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao administrativa para ler identidade e RBAC.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API administrativa indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = adminOverviewOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC administrativo retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    overview: parsed.data,
  };
}
