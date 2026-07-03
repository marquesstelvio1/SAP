"use server";

import { acceptPlatformInvitationFromEnv } from "@saptm/auth";
import { headers } from "next/headers";

import type { AcceptInvitationFormState } from "./form-state";

export async function acceptInvitationAction(
  _previousState: AcceptInvitationFormState,
  formData: FormData,
): Promise<AcceptInvitationFormState> {
  const token = readRequiredFormString(formData, "token");
  const name = readOptionalFormString(formData, "name");
  const password = readRequiredFormString(formData, "password");
  const passwordConfirmation = readRequiredFormString(formData, "passwordConfirmation");

  if (token.length === 0) {
    return {
      status: "error",
      message: "Token de convite ausente ou invalido.",
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
    const requestHeaders = await headers();
    const result = await acceptPlatformInvitationFromEnv({
      token,
      password,
      ...(name === undefined ? {} : { name }),
      ...createRequestMetadata(requestHeaders),
    });

    return {
      status: "success",
      message: "Convite aceite. A sua conta esta ativa e pronta para login.",
      email: result.email,
      membershipId: result.membershipId,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error && error.message.includes("password")
          ? "A password não cumpre a politica de seguranca."
          : "Convite invalido, expirado, cancelado ou já aceite.",
    };
  }
}

function createRequestMetadata(headersList: Headers): { ipAddress?: string; userAgent?: string } {
  const ipAddress = readForwardedIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  return {
    ...(ipAddress === undefined ? {} : { ipAddress }),
    ...(userAgent === undefined ? {} : { userAgent }),
  };
}

function readRequiredFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalFormString(formData: FormData, key: string): string | undefined {
  const value = readRequiredFormString(formData, key);

  return value.length === 0 ? undefined : value;
}

function readForwardedIp(headersList: Headers): string | undefined {
  return (
    headersList.get("x-forwarded-for")?.split(",").at(0)?.trim() ??
    headersList.get("x-real-ip") ??
    undefined
  );
}
