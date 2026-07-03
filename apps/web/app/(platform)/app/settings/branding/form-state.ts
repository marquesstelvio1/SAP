export type BrandingSettingsFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialBrandingSettingsFormState: BrandingSettingsFormState = {
  status: "idle",
  message: "Personalize o aspeto visual da organização: logotipo, cor primaria e favicon.",
};
