"use server";

import { getClientEnv } from "@saptm/config";

export type ForgotPasswordFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function forgotPasswordAction(
  _previousState: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const email = formData.get("email");

  if (typeof email !== "string" || email.length === 0) {
    return {
      status: "error",
      message: "O campo de email é obrigatório.",
    };
  }

  try {
    const { createSaptmAuthFromEnv } = await import("@saptm/auth/server");
    const auth = createSaptmAuthFromEnv() as unknown as {
      api: {
        forgetPassword: (input: {
          body: { email: string; redirectTo: string };
        }) => Promise<unknown>;
      };
    };
    const env = getClientEnv();

    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    });

    return {
      status: "success",
      message: "Email enviado. Verifique a sua caixa de entrada.",
    };
  } catch {
    return {
      status: "success",
      message: "Email enviado. Verifique a sua caixa de entrada.",
    };
  }
}
