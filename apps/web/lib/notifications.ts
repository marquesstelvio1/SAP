import { getClientEnv } from "@saptm/config";
import {
  type NotificationInboxInput,
  type NotificationInboxOutput,
  type NotificationMarkReadInput,
  type NotificationMarkReadOutput,
  notificationInboxOutputSchema,
  notificationMarkReadOutputSchema,
} from "@saptm/rpc";
import { headers } from "next/headers";

export type NotificationInboxResult =
  | {
      status: "ok";
      inbox: NotificationInboxOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

export type NotificationMarkReadResult =
  | {
      status: "ok";
      acknowledgement: NotificationMarkReadOutput;
    }
  | {
      status: "forbidden" | "unavailable" | "invalid";
      message: string;
    };

type RpcJsonEnvelope = {
  json?: unknown;
};

export async function getNotificationInbox(
  input: NotificationInboxInput = { limit: 25 },
): Promise<NotificationInboxResult> {
  const url = new URL("/rpc/notifications/inbox", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem notification.read para consultar a inbox operacional.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de notificacoes indisponivel: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = notificationInboxOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de notificacoes retornou payload invalido.",
    };
  }

  return {
    status: "ok",
    inbox: parsed.data,
  };
}

export async function markNotificationRead(
  input: NotificationMarkReadInput,
): Promise<NotificationMarkReadResult> {
  const url = new URL("/rpc/notifications/markRead", getClientEnv().NEXT_PUBLIC_API_URL);
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie");
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader === null ? {} : { cookie: cookieHeader }),
    },
    body: JSON.stringify({
      json: input,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      status: "forbidden",
      message: "Sessao sem notification.read para reconhecer notificacoes.",
    };
  }

  if (!response.ok) {
    return {
      status: "unavailable",
      message: `API de notificacoes recusou o reconhecimento: HTTP ${response.status}.`,
    };
  }

  const envelope = (await response.json()) as RpcJsonEnvelope;
  const parsed = notificationMarkReadOutputSchema.safeParse(envelope.json);

  if (!parsed.success) {
    return {
      status: "invalid",
      message: "Contrato RPC de notificacoes retornou resposta invalida.",
    };
  }

  return {
    status: "ok",
    acknowledgement: parsed.data,
  };
}
