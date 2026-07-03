import { settingsOverviewOutputSchema } from "@saptm/rpc";

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
  const result = await rpcGet("/rpc/settings/overview", settingsOverviewOutputSchema);

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
      id: result.data.organizationId,
      name: result.data.name,
      slug: result.data.slug,
      status: result.data.status,
      createdAt: result.data.createdAt,
      updatedAt: result.data.updatedAt,
      memberCount: result.data.memberCount,
    },
  };
}
