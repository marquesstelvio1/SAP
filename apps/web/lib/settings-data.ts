import { adminOverviewOutputSchema } from "@saptm/rpc/admin";

import { type RpcFailure, rpcGet } from "./rpc-server";

export type SettingsOrganizationData = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
  memberCount: number;
};

export type SettingsDataResult =
  | {
      status: "ok";
      organization: SettingsOrganizationData;
    }
  | RpcFailure;

export async function getSettingsOrganizationData(): Promise<SettingsDataResult> {
  const result = await rpcGet("/rpc/admin/overview", adminOverviewOutputSchema);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem permissao para ler dados da organizacao.",
        }
      : result;
  }

  return {
    status: "ok",
    organization: {
      id: result.data.organization.id,
      name: result.data.organization.name,
      slug: result.data.organization.slug,
      status: result.data.organization.status as "active" | "suspended",
      createdAt: result.data.organization.createdAt,
      updatedAt: result.data.organization.updatedAt,
      memberCount: result.data.totals.users,
    },
  };
}
