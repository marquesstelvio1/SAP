import { getClientEnv } from "@saptm/config";
import {
  type ReportExportInput,
  type ReportExportOutput,
  reportExportOutputSchema,
} from "@saptm/rpc";
import { headers } from "next/headers";

export type ReportExportResult =
  | {
      status: "ok";
      export: ReportExportOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function exportOperationalReport(
  input: ReportExportInput,
): Promise<ReportExportResult> {
  const url = new URL("/rpc/reports/export", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem report.export ou permissao de leitura do dominio.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de reports indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = reportExportOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de reports retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    export: parsed.data,
  };
}
