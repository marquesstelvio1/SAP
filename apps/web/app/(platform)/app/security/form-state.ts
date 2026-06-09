export type SessionRevocationFormState = {
  status: "idle" | "success" | "error";
  message: string;
  revokedSessions?: number;
};

export const initialSessionRevocationFormState: SessionRevocationFormState = {
  status: "idle",
  message: "Revogue outras sessoes se suspeitar de acesso indevido ou apos troca de password.",
};
