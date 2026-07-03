"use server";

import { getClientEnv } from "@saptm/config";
import { settingsOrganizationUpdateInputSchema } from "@saptm/rpc/settings";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePlatformSession } from "../../../../../lib/auth-session";
import type { GeneralSettingsFormState } from "./form-state";

const manageTenantPermission = "tenant.manage" as const;

export async function updateGeneralSettingsAction(
  _previousState: GeneralSettingsFormState,
  formData: FormData,
): Promise<GeneralSettingsFormState> {
  const platformSession = await requirePlatformSession("/app/settings/general");

  if (!platformSession.viewer.permissions.includes(manageTenantPermission)) {
    return {
      status: "error",
      message: "A sessão não possui tenant.manage para alterar configuracoes da organização.",
    };
  }

  const parsedInput = settingsOrganizationUpdateInputSchema.safeParse({
    name: readRequiredFormString(formData, "name"),
    slug: readRequiredFormString(formData, "slug"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const url = new URL("/rpc/settings/updateOrganization", getClientEnv().NEXT_PUBLIC_API_URL);

  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
      },
      body: JSON.stringify({
        json: parsedInput.data,
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

    revalidatePath("/app/settings/general");

    return {
      status: "success",
      message: "Configuracoes gerais atualizadas com auditoria.",
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possivel atualizar as configuracoes neste momento.",
    };
  }
}

function readRequiredFormString(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}
