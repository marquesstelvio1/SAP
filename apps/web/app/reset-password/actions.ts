"use server";

import { createSaptmAuthFromEnv } from "@saptm/auth/server";

export type ResetPasswordFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function resetPasswordAction(
  _previousState: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const token = formData.get("token");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (typeof token !== "string" || token.length === 0) {
    return {
      status: "error",
      message: "Token de redefinição ausente ou inválido.",
    };
  }

  if (typeof password !== "string" || password.length === 0) {
    return {
      status: "error",
      message: "A nova password é obrigatória.",
    };
  }

  if (password !== passwordConfirmation) {
    return {
      status: "error",
      message: "A confirmação da password não coincide.",
    };
  }

  if (password.length < 12 || password.length > 128) {
    return {
      status: "error",
      message: "A password deve ter entre 12 e 128 caracteres.",
    };
  }

  try {
    const auth = createSaptmAuthFromEnv();

    await auth.api.resetPassword({
      body: {
        newPassword: password,
        token,
      },
    });

    return {
      status: "success",
      message: "Password redefinida com sucesso. Redirecionando para o login...",
    };
  } catch {
    return {
      status: "error",
      message: "Token inválido ou expirado.",
    };
  }
}
