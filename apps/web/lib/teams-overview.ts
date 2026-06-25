import { adminOverviewOutputSchema } from "@saptm/rpc/admin";
import { getTeamInputSchema, getTeamOutputSchema } from "@saptm/rpc/teams";

import { rpcGet } from "./rpc-server";

export type OrgUser = {
  id: string;
  name: string;
  email: string;
};

export async function getOrgUsers(): Promise<OrgUser[]> {
  const result = await rpcGet("/rpc/admin/overview", adminOverviewOutputSchema, {
    searchParams: { limit: 100, offset: 0 },
  });

  if (result.status !== "ok") {
    return [];
  }

  return result.data.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));
}

export async function getTeamDetail(teamId: string) {
  const input = getTeamInputSchema.parse({ teamId });

  return rpcGet("/rpc/teams/get", getTeamOutputSchema, {
    searchParams: input,
  });
}
