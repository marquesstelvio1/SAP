import {
  type AuditExportInput,
  type AuditExportOutput,
  type AuditSearchInput,
  type AuditSearchOutput,
  auditExportOutputSchema,
  auditSearchOutputSchema,
} from "@saptm/rpc/audit";

import { type RpcFailure, rpcPost } from "./rpc-server";

export type AuditSearchResult =
  | {
      status: "ok";
      search: AuditSearchOutput;
    }
  | RpcFailure;

export type AuditExportResult =
  | {
      status: "ok";
      export: AuditExportOutput;
    }
  | RpcFailure;

export async function searchAuditRecords(input: AuditSearchInput): Promise<AuditSearchResult> {
  const result = await rpcPost("/rpc/audit/search", auditSearchOutputSchema, input);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem permissao audit.read para pesquisar auditoria.",
        }
      : result;
  }

  return { status: "ok", search: result.data };
}

export async function exportAuditRecords(input: AuditExportInput): Promise<AuditExportResult> {
  const result = await rpcPost("/rpc/audit/export", auditExportOutputSchema, input);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem audit.read/report.export para exportar auditoria.",
        }
      : result;
  }

  return { status: "ok", export: result.data };
}
