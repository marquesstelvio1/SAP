"use server";

import { getClientEnv } from "@saptm/config";
import {
  createWebhookInputSchema,
  createWebhookOutputSchema,
  deleteWebhookInputSchema,
  updateWebhookInputSchema,
  updateWebhookOutputSchema,
} from "@saptm/rpc/webhooks";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type WebhookFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

type RpcJsonEnvelope = {
  json?: unknown;
};

async function callWebhookMutation(
  path: string,
  input: unknown,
): Promise<{ status: "ok" | "error"; envelope: RpcJsonEnvelope; message?: string }> {
  const url = new URL(path, getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");

  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
      },
      body: JSON.stringify({ json: input }),
    });

    const envelope = (await response.json()) as RpcJsonEnvelope;

    if (!response.ok) {
      return { status: "error", envelope, message: `API error: HTTP ${response.status}` };
    }

    return { status: "ok", envelope };
  } catch (error) {
    return {
      status: "error",
      envelope: {},
      message: error instanceof Error ? error.message : "Erro de rede",
    };
  }
}

export async function createWebhookAction(
  _previousState: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const name = formData.get("name");
  const url = formData.get("url");
  const eventsRaw = formData.get("events");

  const events =
    typeof eventsRaw === "string"
      ? eventsRaw
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

  const parsedInput = createWebhookInputSchema.safeParse({ name, url, events });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callWebhookMutation("/rpc/webhooks/create", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message ?? "Falha ao criar webhook" };
  }

  const parsedOutput = createWebhookOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return { status: "error", message: "Contrato RPC retornou payload invalido." };
  }

  revalidatePath("/app/settings/webhooks");

  return {
    status: "success",
    message: `Webhook "${parsedOutput.data.webhook.name}" criado com sucesso.`,
  };
}

export async function updateWebhookAction(
  _previousState: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const webhookId = formData.get("webhookId");
  const name = formData.get("name");
  const url = formData.get("url");
  const eventsRaw = formData.get("events");
  const isActive = formData.get("isActive");

  const events =
    typeof eventsRaw === "string"
      ? eventsRaw
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : undefined;

  const parsedInput = updateWebhookInputSchema.safeParse({
    webhookId,
    name: name || undefined,
    url: url || undefined,
    events,
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callWebhookMutation("/rpc/webhooks/update", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message ?? "Falha ao atualizar webhook" };
  }

  const parsedOutput = updateWebhookOutputSchema.safeParse(result.envelope.json);

  if (!parsedOutput.success) {
    return { status: "error", message: "Contrato RPC retornou payload invalido." };
  }

  revalidatePath("/app/settings/webhooks");

  return {
    status: "success",
    message: `Webhook "${parsedOutput.data.webhook.name}" atualizado com sucesso.`,
  };
}

export async function deleteWebhookAction(
  _previousState: WebhookFormState,
  formData: FormData,
): Promise<WebhookFormState> {
  const webhookId = formData.get("webhookId");

  const parsedInput = deleteWebhookInputSchema.safeParse({ webhookId });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues.map((i) => i.message).join(" "),
    };
  }

  const result = await callWebhookMutation("/rpc/webhooks/delete", parsedInput.data);

  if (result.status !== "ok") {
    return { status: "error", message: result.message ?? "Falha ao remover webhook" };
  }

  revalidatePath("/app/settings/webhooks");

  return {
    status: "success",
    message: "Webhook removido com sucesso.",
  };
}
