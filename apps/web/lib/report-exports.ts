import {
  type ReportExportInput,
  type ReportExportOutput,
  reportExportOutputSchema,
} from "@saptm/rpc/reports";

import { type RpcFailure, rpcPost } from "./rpc-server";

export type ReportExportResult =
  | {
      status: "ok";
      export: ReportExportOutput;
    }
  | RpcFailure;

export async function exportOperationalReport(
  input: ReportExportInput,
): Promise<ReportExportResult> {
  const result = await rpcPost("/rpc/reports/export", reportExportOutputSchema, input);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem report.export ou permissao de leitura do dominio.",
        }
      : result;
  }

  return { status: "ok", export: result.data };
}
