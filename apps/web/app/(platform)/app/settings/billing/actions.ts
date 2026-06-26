"use server";

import {
  createCheckoutSessionInputSchema,
  createCheckoutSessionOutputSchema,
  createPortalSessionInputSchema,
  createPortalSessionOutputSchema,
} from "@saptm/rpc/billing";
import { type RpcFailure, rpcPost } from "../../../../../lib/rpc-server";

type BillingCheckoutResult =
  | {
      status: "ok";
      url: string;
    }
  | RpcFailure;

type BillingPortalResult =
  | {
      status: "ok";
      url: string;
    }
  | RpcFailure;

export async function createCheckoutSessionAction(
  _prevState: unknown,
  formData: FormData,
): Promise<BillingCheckoutResult> {
  const plan = formData.get("plan");
  const successUrl = formData.get("successUrl");
  const cancelUrl = formData.get("cancelUrl");

  const parsed = createCheckoutSessionInputSchema.safeParse({
    plan,
    successUrl,
    cancelUrl,
  });

  if (!parsed.success) {
    return { status: "invalid", message: "Dados de checkout invalidos." } as RpcFailure;
  }

  const result = await rpcPost(
    "/rpc/billing/createCheckoutSession",
    createCheckoutSessionOutputSchema,
    parsed.data,
  );

  if (result.status !== "ok") {
    return result;
  }

  const data = result.data as { url: string };

  return {
    status: "ok",
    url: data.url,
  };
}

export async function createPortalSessionAction(
  _prevState: unknown,
  formData: FormData,
): Promise<BillingPortalResult> {
  const returnUrl = formData.get("returnUrl");

  const parsed = createPortalSessionInputSchema.safeParse({
    returnUrl,
  });

  if (!parsed.success) {
    return { status: "invalid", message: "Dados de portal invalidos." } as RpcFailure;
  }

  const result = await rpcPost(
    "/rpc/billing/createPortalSession",
    createPortalSessionOutputSchema,
    parsed.data,
  );

  if (result.status !== "ok") {
    return result;
  }

  const data = result.data as { url: string };

  return {
    status: "ok",
    url: data.url,
  };
}
