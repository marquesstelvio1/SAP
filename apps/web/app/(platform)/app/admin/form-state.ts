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
  message: "Convide utilizadores para a organização com permissões definidas.",
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
  message: "Atribua permissões a membros da organização.",
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
  message: "Crie roles personalizadas com permissões selecionadas.",
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
  message: "Atualize permissões de roles personalizadas.",
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
  message: "Elimine roles personalizadas sem membros associados.",
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
  message: "Revogue uma role atribuida a um membro da organização.",
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
  message: "Ative, suspenda ou remova membros da organização.",
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
  message: "Reenvie ou cancele convites pendentes.",
};
