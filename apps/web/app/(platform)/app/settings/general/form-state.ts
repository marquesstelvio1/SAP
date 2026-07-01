export type GeneralSettingsFormState = {
  status: "idle" | "success" | "error";
  message: string;
  organizationId?: string;
  updatedAt?: string;
};

export const initialGeneralSettingsFormState: GeneralSettingsFormState = {
  status: "idle",
  message: "Altere o nome ou slug da organizacao. As alteracoes sao auditaveis.",
};
