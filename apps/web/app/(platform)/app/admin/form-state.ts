export type AdminUserInviteFormState = {
  status: "idle" | "success" | "error";
  message: string;
  userId?: string;
  membershipId?: string;
  email?: string;
  invitationAcceptUrl?: string;
  invitationExpiresAt?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminUserInviteFormState: AdminUserInviteFormState = {
  status: "idle",
  message: "Convide utilizadores para o tenant com roles governadas, audit e outbox.",
};

export type AdminRoleAssignFormState = {
  status: "idle" | "success" | "error";
  message: string;
  membershipId?: string;
  roleId?: string;
  roleKey?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminRoleAssignFormState: AdminRoleAssignFormState = {
  status: "idle",
  message: "Atribua roles existentes a membros do tenant com trilha auditavel.",
};

export type AdminRoleCreateFormState = {
  status: "idle" | "success" | "error";
  message: string;
  roleId?: string;
  roleKey?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminRoleCreateFormState: AdminRoleCreateFormState = {
  status: "idle",
  message: "Crie roles customizadas tenant-scoped com permissoes selecionadas.",
};

export type AdminRolePermissionsFormState = {
  status: "idle" | "success" | "error";
  message: string;
  roleId?: string;
  roleKey?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminRolePermissionsFormState: AdminRolePermissionsFormState = {
  status: "idle",
  message: "Atualize permissoes de roles customizadas sem alterar templates bootstrap.",
};

export type AdminRoleDeleteFormState = {
  status: "idle" | "success" | "error";
  message: string;
  roleId?: string;
  roleKey?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminRoleDeleteFormState: AdminRoleDeleteFormState = {
  status: "idle",
  message: "Elimine roles customizadas sem memberships associados.",
};

export type AdminRoleRevokeFormState = {
  status: "idle" | "success" | "error";
  message: string;
  membershipId?: string;
  roleId?: string;
  roleKey?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminRoleRevokeFormState: AdminRoleRevokeFormState = {
  status: "idle",
  message: "Revogue uma role atribuida preservando regras anti-lockout.",
};

export type AdminMembershipStatusFormState = {
  status: "idle" | "success" | "error";
  message: string;
  membershipId?: string;
  membershipStatus?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminMembershipStatusFormState: AdminMembershipStatusFormState = {
  status: "idle",
  message: "Ative, suspenda ou remova memberships com auditoria e outbox.",
};

export type AdminInvitationLifecycleFormState = {
  status: "idle" | "success" | "error";
  message: string;
  membershipId?: string;
  invitationAcceptUrl?: string;
  invitationExpiresAt?: string;
  idempotencyKey?: string;
  replayed?: boolean;
};

export const initialAdminInvitationLifecycleFormState: AdminInvitationLifecycleFormState = {
  status: "idle",
  message: "Reenvie ou cancele convites pendentes de forma auditavel.",
};
