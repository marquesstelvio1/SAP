export type AcceptInvitationFormState = {
  status: "idle" | "success" | "error";
  message: string;
  email?: string;
  membershipId?: string;
};

export const initialAcceptInvitationFormState: AcceptInvitationFormState = {
  status: "idle",
  message: "Defina a password corporativa para ativar o seu acesso a organização.",
};
