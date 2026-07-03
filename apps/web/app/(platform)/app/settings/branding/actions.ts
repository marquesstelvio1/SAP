"use server";

import { getClientEnv } from "@saptm/config";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../../lib/auth-session";
import type { BrandingSettingsFormState } from "./form-state";

const manageTenantPermission = "tenant.manage" as const;

export async function updateBrandingSettingsAction(
  _previousState: BrandingSettingsFormState,
  formData: FormData,
): Promise<BrandingSettingsFormState> {
  const platformSession = await requirePlatformSession("/app/settings/branding");

  if (!platformSession.viewer.permissions.includes(manageTenantPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tenant.manage para alterar branding da organização.",
    };
  }

  const primaryColor = formData.get("primaryColor");
  if (typeof primaryColor === "string" && primaryColor.trim().length > 0) {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;

    if (!hexRegex.test(primaryColor.trim())) {
      return {
        status: "error",
        message: "Cor primaria deve ser um valor hex válido (ex: #FF6600).",
      };
    }
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/settings/updateBranding", getClientEnv().NEXT_PUBLIC_API_URL);

  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
      },
      body: JSON.stringify({
        json: {
          ...(typeof primaryColor === "string" && primaryColor.trim().length > 0
            ? { primaryColor: primaryColor.trim() }
            : {}),
        },
      }),
    });

    if (response.status === 401 || response.status === 403) {
      return {
        status: "error",
        message: "API recusou a operação por sessão, organização ou permissão insuficiente.",
      };
    }

    if (!response.ok) {
      return {
        status: "error",
        message: `API recusou a operação: HTTP ${response.status}.`,
      };
    }

    revalidatePath("/app/settings/branding");

    return {
      status: "success",
      message: "Branding atualizado com sucesso.",
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possivel atualizar o branding neste momento.",
    };
  }
}
