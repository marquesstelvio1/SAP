import { getClientEnv } from "@saptm/config";
import {
  type AuditExportInput,
  type AuditExportOutput,
  type AuditSearchInput,
  type AuditSearchOutput,
  auditExportOutputSchema,
  auditSearchOutputSchema,
} from "@saptm/rpc";
import { headers } from "next/headers";

export type AuditSearchResult =
  | {
      status: "ok";
      search: AuditSearchOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

export type AuditExportResult =
  | {
      status: "ok";
      export: AuditExportOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function searchAuditRecords(input: AuditSearchInput): Promise<AuditSearchResult> {
  const response = await callAuditRpc("/rpc/audit/search", input);

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem permissao audit.read para pesquisar auditoria.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de auditoria indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = auditSearchOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de auditoria retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    search: parsed.data,
  };
}

export async function exportAuditRecords(input: AuditExportInput): Promise<AuditExportResult> {
  const response = await callAuditRpc("/rpc/audit/export", input);

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem audit.read/report.export para exportar auditoria.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de exportacao de auditoria indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = auditExportOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de exportacao retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    export: parsed.data,
  };
}

async function callAuditRpc(path: string, input: unknown): Promise<Response> {
  const url = new URL(path, getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");

  return fetch(url, {
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
}
