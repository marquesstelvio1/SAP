import {
  type NotificationInboxInput,
  type NotificationInboxOutput,
  type NotificationMarkReadInput,
  type NotificationMarkReadOutput,
  notificationInboxOutputSchema,
  notificationMarkReadOutputSchema,
} from "@saptm/rpc/notifications";

import { type RpcFailure, rpcPost } from "./rpc-server";

export type NotificationInboxResult =
  | {
      status: "ok";
      inbox: NotificationInboxOutput;
    }
  | RpcFailure;

export type NotificationMarkReadResult =
  | {
      status: "ok";
      acknowledgement: NotificationMarkReadOutput;
    }
  | RpcFailure;

export async function getNotificationInbox(
  input: NotificationInboxInput = { limit: 25 },
): Promise<NotificationInboxResult> {
  const result = await rpcPost("/rpc/notifications/inbox", notificationInboxOutputSchema, input);

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem notification.read para consultar a inbox operacional.",
        }
      : result;
  }

  return { status: "ok", inbox: result.data };
}

export async function markNotificationRead(
  input: NotificationMarkReadInput,
): Promise<NotificationMarkReadResult> {
  const result = await rpcPost(
    "/rpc/notifications/markRead",
    notificationMarkReadOutputSchema,
    input,
  );

  if (result.status !== "ok") {
    return result.status === "forbidden"
      ? {
          status: "forbidden",
          message: "Sessao sem notification.read para reconhecer notificacoes.",
        }
      : result;
  }

  return { status: "ok", acknowledgement: result.data };
}
