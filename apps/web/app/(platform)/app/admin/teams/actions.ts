"use server";

import { getClientEnv } from "@saptm/config";
import {
  addTeamMemberInputSchema,
  addTeamMemberOutputSchema,
  createTeamInputSchema,
  createTeamOutputSchema,
  removeTeamMemberInputSchema,
  removeTeamMemberOutputSchema,
  updateTeamMemberRoleInputSchema,
  updateTeamMemberRoleOutputSchema,
} from "@saptm/rpc/teams";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createIdempotencyKey } from "@/lib/idempotency";
import { requirePlatformSession } from "../../../../../lib/auth-session";
import type { CreateTeamFormState } from "./create-team-dialog";
import type { TeamMembersFormState } from "./team-members-dialog";

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function createTeamAction(
  _previousState: CreateTeamFormState,
  formData: FormData,
): Promise<CreateTeamFormState> {
  const platformSession = await requirePlatformSession("/app/admin/teams");

  if (!platformSession.viewer.permissions.includes("tenant.manage")) {
    return {
      status: "error",
      message: "A sessão não possui tenant.manage para criar equipas.",
    };
  }

  const parsedInput = createTeamInputSchema.safeParse({
    name: readRequiredFormString(formData, "name"),
    slug: readRequiredFormString(formData, "slug"),
    description: readOptionalFormString(formData, "description"),
    idempotencyKey: createIdempotencyKey("admin_teams"),
    sourceSystem: "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callTeamMutation("/rpc/teams/create", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message };
  }

  const parsedOutput = createTeamOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return { status: "error", message: "Contrato RPC retornou payload invalido." };
  }

  revalidatePath("/app/admin/teams");

  return {
    status: "success",
    message: `Equipa "${parsedOutput.data.team.name}" criada com sucesso.`,
  };
}

export async function addTeamMemberAction(
  _previousState: TeamMembersFormState,
  formData: FormData,
): Promise<TeamMembersFormState> {
  const platformSession = await requirePlatformSession("/app/admin/teams");

  if (!platformSession.viewer.permissions.includes("tenant.manage")) {
    return {
      status: "error",
      message: "A sessão não possui tenant.manage para gerir membros.",
    };
  }

  const parsedInput = addTeamMemberInputSchema.safeParse({
    teamId: readRequiredFormString(formData, "teamId"),
    userId: readRequiredFormString(formData, "userId"),
    role: readRequiredFormString(formData, "role"),
    idempotencyKey: createIdempotencyKey("admin_teams"),
    sourceSystem: "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callTeamMutation("/rpc/teams/addMember", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message };
  }

  const parsedOutput = addTeamMemberOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return { status: "error", message: "Contrato RPC retornou payload invalido." };
  }

  revalidatePath("/app/admin/teams");

  return {
    status: "success",
    message: `Membro adicionado a equipa.`,
  };
}

export async function removeTeamMemberAction(
  _previousState: TeamMembersFormState,
  formData: FormData,
): Promise<TeamMembersFormState> {
  const platformSession = await requirePlatformSession("/app/admin/teams");

  if (!platformSession.viewer.permissions.includes("tenant.manage")) {
    return {
      status: "error",
      message: "A sessão não possui tenant.manage para remover membros.",
    };
  }

  const parsedInput = removeTeamMemberInputSchema.safeParse({
    teamId: readRequiredFormString(formData, "teamId"),
    userId: readRequiredFormString(formData, "userId"),
    idempotencyKey: createIdempotencyKey("admin_teams"),
    sourceSystem: "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callTeamMutation("/rpc/teams/removeMember", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message };
  }

  const parsedOutput = removeTeamMemberOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return { status: "error", message: "Contrato RPC retornou payload invalido." };
  }

  revalidatePath("/app/admin/teams");

  return {
    status: "success",
    message: "Membro removido da equipa.",
  };
}

export async function updateTeamMemberRoleAction(
  _previousState: TeamMembersFormState,
  formData: FormData,
): Promise<TeamMembersFormState> {
  const platformSession = await requirePlatformSession("/app/admin/teams");

  if (!platformSession.viewer.permissions.includes("tenant.manage")) {
    return {
      status: "error",
      message: "A sessão não possui tenant.manage para alterar papeis.",
    };
  }

  const parsedInput = updateTeamMemberRoleInputSchema.safeParse({
    teamId: readRequiredFormString(formData, "teamId"),
    userId: readRequiredFormString(formData, "userId"),
    role: readRequiredFormString(formData, "role"),
    idempotencyKey: createIdempotencyKey("admin_teams"),
    sourceSystem: "saptm",
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callTeamMutation("/rpc/teams/updateMemberRole", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message };
  }

  const parsedOutput = updateTeamMemberRoleOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return { status: "error", message: "Contrato RPC retornou payload invalido." };
  }

  revalidatePath("/app/admin/teams");

  return {
    status: "success",
    message: "Papel do membro atualizado.",
  };
}

type TeamMutationResult =
  | {
      status: "ok";
      envelope: RpcJsonEnvelope;
    }
  | {
      status: "error";
      message: string;
    };

async function callTeamMutation(path: string, input: unknown): Promise<TeamMutationResult> {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL(path, getClientEnv().NEXT_PUBLIC_API_URL);
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
      status: "error",
      message: "API recusou a operação por sessão, organização ou permissão insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API recusou a operação: HTTP ${response.status}.`,
    };
  }

  return {
    status: "ok",
    envelope: (await response.json()) as RpcJsonEnvelope,
  };
}

function readRequiredFormString(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readOptionalFormString(formData: FormData, name: string): string | undefined {
  const value = readRequiredFormString(formData, name);

  return value.length === 0 ? undefined : value;
}
