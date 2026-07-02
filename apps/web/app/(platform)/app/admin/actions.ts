"use server";

import type { PlatformPermission } from "@saptm/auth";
import { getClientEnv } from "@saptm/config";
import {
  adminInvitationCancelInputSchema,
  adminInvitationLifecycleOutputSchema,
  adminInvitationResendInputSchema,
  adminMembershipStatusUpdateInputSchema,
  adminMembershipStatusUpdateOutputSchema,
  adminRoleAssignInputSchema,
  adminRoleAssignOutputSchema,
  adminRoleCreateInputSchema,
  adminRoleDeleteInputSchema,
  adminRoleDeleteOutputSchema,
  adminRoleMutationOutputSchema,
  adminRolePermissionsUpdateInputSchema,
  adminRoleRevokeInputSchema,
  adminRoleRevokeOutputSchema,
  adminUserInviteInputSchema,
  adminUserInviteOutputSchema,
} from "@saptm/rpc/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../lib/auth-session";
import type {
  AdminInvitationLifecycleFormState,
  AdminMembershipStatusFormState,
  AdminRoleAssignFormState,
  AdminRoleCreateFormState,
  AdminRoleDeleteFormState,
  AdminRolePermissionsFormState,
  AdminRoleRevokeFormState,
  AdminUserInviteFormState,
} from "./form-state";
import { initialAdminInvitationLifecycleFormState } from "./form-state";

const inviteUserPermission: PlatformPermission = "identity.user.invite";
const assignRolePermission: PlatformPermission = "identity.role.assign";
const manageTenantPermission: PlatformPermission = "tenant.manage";

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function inviteAdminUserAction(
  _previousState: AdminUserInviteFormState,
  formData: FormData,
): Promise<AdminUserInviteFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!platformSession.viewer.permissions.includes(inviteUserPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui identity.user.invite para convidar utilizadores.",
    };
  }

  const parsedInput = parseAdminUserInviteFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/inviteUser", parsedInput.input);

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminUserInviteOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC administrativo retornou resposta invalida para convite.",
    };
  }

  revalidatePath("/app/admin");

  return {
    status: "success",
    message: "Utilizador convidado com membership, roles, audit trail e outbox.",
    userId: parsedOutput.data.userId,
    membershipId: parsedOutput.data.membershipId,
    email: parsedOutput.data.user.email,
    ...(parsedOutput.data.invitation === undefined
      ? {}
      : {
          invitationAcceptUrl: parsedOutput.data.invitation.acceptUrl,
          invitationExpiresAt: parsedOutput.data.invitation.expiresAt,
        }),
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function assignAdminRoleAction(
  _previousState: AdminRoleAssignFormState,
  formData: FormData,
): Promise<AdminRoleAssignFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!platformSession.viewer.permissions.includes(assignRolePermission)) {
    return {
      status: "error",
      message: "A sessao nao possui identity.role.assign para atribuir roles.",
    };
  }

  const parsedInput = parseAdminRoleAssignFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/assignRole", parsedInput.input);

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminRoleAssignOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC administrativo retornou resposta invalida para atribuicao de role.",
    };
  }

  revalidatePath("/app/admin");

  return {
    status: "success",
    message: "Perfil atribuído com validação operacional e auditoria.",
    membershipId: parsedOutput.data.membershipId,
    roleId: parsedOutput.data.roleId,
    roleKey: parsedOutput.data.assignedRole.key,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function createAdminRoleAction(
  _previousState: AdminRoleCreateFormState,
  formData: FormData,
): Promise<AdminRoleCreateFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!canManageRoleCatalog(platformSession.viewer.permissions)) {
    return {
      status: "error",
      message: "A sessão não tem autorização para criar perfis.",
    };
  }

  const parsedInput = parseAdminRoleCreateFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/createRole", parsedInput.input);

  return parseAdminRoleMutationResult(result, "Perfil personalizado criado com permissões configuradas.");
}

export async function updateAdminRolePermissionsAction(
  _previousState: AdminRolePermissionsFormState,
  formData: FormData,
): Promise<AdminRolePermissionsFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!canManageRoleCatalog(platformSession.viewer.permissions)) {
    return {
      status: "error",
      message: "A sessão não tem autorização para editar perfis.",
    };
  }

  const parsedInput = parseAdminRolePermissionsFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/updateRolePermissions", parsedInput.input);

  return parseAdminRoleMutationResult(result, "Permissões do perfil personalizado actualizadas.");
}

export async function deleteAdminRoleAction(
  _previousState: AdminRoleDeleteFormState,
  formData: FormData,
): Promise<AdminRoleDeleteFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!canManageRoleCatalog(platformSession.viewer.permissions)) {
    return {
      status: "error",
      message: "A sessão não tem autorização para eliminar perfis.",
    };
  }

  const parsedInput = parseAdminRoleDeleteFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/deleteRole", parsedInput.input);

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminRoleDeleteOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Não foi possível confirmar a eliminação do perfil.",
    };
  }

  revalidatePath("/app/admin");

  return {
    status: "success",
    message: "Perfil personalizado eliminado com auditoria.",
    roleId: parsedOutput.data.roleId,
    roleKey: parsedOutput.data.roleKey,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function revokeAdminRoleAction(
  _previousState: AdminRoleRevokeFormState,
  formData: FormData,
): Promise<AdminRoleRevokeFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!platformSession.viewer.permissions.includes(assignRolePermission)) {
    return {
      status: "error",
      message: "A sessão não tem autorização para revogar perfis.",
    };
  }

  const parsedInput = parseAdminRoleRevokeFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/revokeRole", parsedInput.input);

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminRoleRevokeOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Não foi possível confirmar a revogação do perfil.",
    };
  }

  revalidatePath("/app/admin");

  return {
    status: "success",
    message: "Perfil revogado com validações de segurança.",
    membershipId: parsedOutput.data.membershipId,
    roleId: parsedOutput.data.roleId,
    roleKey: parsedOutput.data.revokedRole.key,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function updateAdminMembershipStatusAction(
  _previousState: AdminMembershipStatusFormState,
  formData: FormData,
): Promise<AdminMembershipStatusFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!canManageMembershipLifecycle(platformSession.viewer.permissions)) {
    return {
      status: "error",
      message: "A sessão não tem autorização para actualizar membros.",
    };
  }

  const parsedInput = parseAdminMembershipStatusFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/updateMembershipStatus", parsedInput.input);

  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminMembershipStatusUpdateOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Não foi possível confirmar a actualização do membro.",
    };
  }

  revalidatePath("/app/admin");

  return {
    status: "success",
    message: "Membro actualizado com auditoria.",
    membershipId: parsedOutput.data.membershipId,
    membershipStatus: parsedOutput.data.status,
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

export async function resendAdminInvitationAction(
  _previousState: AdminInvitationLifecycleFormState,
  formData: FormData,
): Promise<AdminInvitationLifecycleFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!platformSession.viewer.permissions.includes(inviteUserPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui identity.user.invite para reenviar convites.",
    };
  }

  const parsedInput = parseAdminInvitationResendFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/resendInvitation", parsedInput.input);

  return parseAdminInvitationLifecycleResult(result, "Convite reenviado via outbox auditavel.");
}

export async function cancelAdminInvitationAction(
  _previousState: AdminInvitationLifecycleFormState,
  formData: FormData,
): Promise<AdminInvitationLifecycleFormState> {
  const platformSession = await requirePlatformSession("/app/admin");

  if (!platformSession.viewer.permissions.includes(inviteUserPermission)) {
    return {
      status: "error",
      message: "A sessao nao possui identity.user.invite para cancelar convites.",
    };
  }

  const parsedInput = parseAdminInvitationCancelFormData(formData);

  if (!("input" in parsedInput)) {
    return parsedInput;
  }

  const result = await callAdminMutation("/rpc/admin/cancelInvitation", parsedInput.input);

  return parseAdminInvitationLifecycleResult(result, "Convite cancelado e acesso removido.");
}

type AdminMutationResult =
  | {
      status: "ok";
      envelope: RpcJsonEnvelope;
    }
  | {
      status: "error";
      message: string;
    };

async function callAdminMutation(path: string, input: unknown): Promise<AdminMutationResult> {
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
      message: "API recusou a operacao por sessao, organizacao ou permissao insuficiente.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: `API administrativa recusou a operacao: HTTP ${response.status}.`,
    };
  }

  return {
    status: "ok",
    envelope: (await response.json()) as RpcJsonEnvelope,
  };
}

function parseAdminUserInviteFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminUserInviteInputSchema.parse>;
    }
  | AdminUserInviteFormState {
  const roleKey = readOptionalFormString(formData, "roleKey");
  const parsedInput = adminUserInviteInputSchema.safeParse({
    email: readRequiredFormString(formData, "email"),
    name: readRequiredFormString(formData, "name"),
    roleKeys: roleKey === undefined ? [] : [roleKey],
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminRoleAssignFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminRoleAssignInputSchema.parse>;
    }
  | AdminRoleAssignFormState {
  const parsedInput = adminRoleAssignInputSchema.safeParse({
    membershipId: readRequiredFormString(formData, "membershipId"),
    roleId: readRequiredFormString(formData, "roleId"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminRoleCreateFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminRoleCreateInputSchema.parse>;
    }
  | AdminRoleCreateFormState {
  const parsedInput = adminRoleCreateInputSchema.safeParse({
    key: readRequiredFormString(formData, "key"),
    name: readRequiredFormString(formData, "name"),
    description: readOptionalFormString(formData, "description"),
    permissionKeys: parsePermissionKeys(formData),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminRolePermissionsFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminRolePermissionsUpdateInputSchema.parse>;
    }
  | AdminRolePermissionsFormState {
  const parsedInput = adminRolePermissionsUpdateInputSchema.safeParse({
    roleId: readRequiredFormString(formData, "roleId"),
    permissionKeys: parsePermissionKeys(formData),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminRoleDeleteFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminRoleDeleteInputSchema.parse>;
    }
  | AdminRoleDeleteFormState {
  const parsedInput = adminRoleDeleteInputSchema.safeParse({
    roleId: readRequiredFormString(formData, "roleId"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminRoleRevokeFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminRoleRevokeInputSchema.parse>;
    }
  | AdminRoleRevokeFormState {
  const assignment = readOptionalFormString(formData, "assignment")?.split(":");
  const parsedInput = adminRoleRevokeInputSchema.safeParse({
    membershipId: readOptionalFormString(formData, "membershipId") ?? assignment?.at(0) ?? "",
    roleId: readOptionalFormString(formData, "roleId") ?? assignment?.at(1) ?? "",
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminMembershipStatusFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminMembershipStatusUpdateInputSchema.parse>;
    }
  | AdminMembershipStatusFormState {
  const parsedInput = adminMembershipStatusUpdateInputSchema.safeParse({
    membershipId: readRequiredFormString(formData, "membershipId"),
    status: readRequiredFormString(formData, "status"),
    reason: readRequiredFormString(formData, "reason"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminInvitationResendFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminInvitationResendInputSchema.parse>;
    }
  | AdminInvitationLifecycleFormState {
  const parsedInput = adminInvitationResendInputSchema.safeParse({
    membershipId: readRequiredFormString(formData, "membershipId"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parseAdminInvitationCancelFormData(formData: FormData):
  | {
      input: ReturnType<typeof adminInvitationCancelInputSchema.parse>;
    }
  | AdminInvitationLifecycleFormState {
  const parsedInput = adminInvitationCancelInputSchema.safeParse({
    membershipId: readRequiredFormString(formData, "membershipId"),
    reason: readRequiredFormString(formData, "reason"),
    idempotencyKey: readRequiredFormString(formData, "idempotencyKey"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  return {
    input: parsedInput.data,
  };
}

function parsePermissionKeys(formData: FormData): string[] {
  return readRequiredFormString(formData, "permissionKeys")
    .split(/[\s,]+/)
    .map((permissionKey) => permissionKey.trim())
    .filter((permissionKey) => permissionKey.length > 0);
}

function parseAdminRoleMutationResult(
  result: AdminMutationResult,
  successMessage: string,
): AdminRoleCreateFormState {
  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminRoleMutationOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    const parsedDeleteOutput = adminRoleDeleteOutputSchema.safeParse(result.envelope.json);

    if (!parsedDeleteOutput.success) {
      return {
        status: "error",
        message: "Contrato RPC administrativo retornou resposta invalida para role.",
      };
    }
  }

  revalidatePath("/app/admin");

  if (parsedOutput.success) {
    return {
      status: "success",
      message: successMessage,
      roleId: parsedOutput.data.roleId,
      roleKey: parsedOutput.data.role.key,
      idempotencyKey: parsedOutput.data.idempotency.key,
      replayed: parsedOutput.data.idempotency.replayed,
    };
  }

  return {
    status: "error",
    message: "Contrato RPC administrativo retornou resposta invalida para role.",
  };
}

function parseAdminInvitationLifecycleResult(
  result: AdminMutationResult,
  successMessage: string,
): AdminInvitationLifecycleFormState {
  if (result.status !== "ok") {
    return {
      status: "error",
      message: result.message,
    };
  }

  const parsedOutput = adminInvitationLifecycleOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return {
      status: "error",
      message: "Contrato RPC administrativo retornou resposta invalida para convite.",
    };
  }

  revalidatePath("/app/admin");

  return {
    status: "success",
    message: successMessage,
    membershipId: parsedOutput.data.membershipId,
    ...(parsedOutput.data.invitation === undefined
      ? {}
      : {
          invitationAcceptUrl: parsedOutput.data.invitation.acceptUrl,
          invitationExpiresAt: parsedOutput.data.invitation.expiresAt,
        }),
    idempotencyKey: parsedOutput.data.idempotency.key,
    replayed: parsedOutput.data.idempotency.replayed,
  };
}

function canManageRoleCatalog(permissions: readonly PlatformPermission[]): boolean {
  return permissions.includes(manageTenantPermission) && permissions.includes(assignRolePermission);
}

function canManageMembershipLifecycle(permissions: readonly PlatformPermission[]): boolean {
  return permissions.includes(inviteUserPermission) && permissions.includes(assignRolePermission);
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

export async function resendInvitationAction(formData: FormData): Promise<void> {
  await resendAdminInvitationAction(initialAdminInvitationLifecycleFormState, formData);
}

export async function cancelInvitationAction(formData: FormData): Promise<void> {
  await cancelAdminInvitationAction(initialAdminInvitationLifecycleFormState, formData);
}
