import { type AdminOverviewOutput, adminOverviewOutputSchema } from "@saptm/rpc/admin";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type AdminOverviewResult =
  | {
      status: "ok";
      overview: AdminOverviewOutput;
    }
  | RpcFailure;

export async function getAdminOverview(options?: {
  offset?: number;
  limit?: number;
}): Promise<AdminOverviewResult> {
  const result = await rpcGet(
    "/rpc/admin/overview",
    adminOverviewOutputSchema,
    options === undefined ? {} : { searchParams: options },
  );

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem permissao administrativa para ler identidade e RBAC.",
        }
      : result;
  }

  return { status: "ok", overview: result.data };
}
