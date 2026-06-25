import {
  billingOverviewOutputSchema,
  billingPlansOutputSchema,
  createCheckoutSessionInputSchema,
  createCheckoutSessionOutputSchema,
  createPortalSessionInputSchema,
  createPortalSessionOutputSchema,
} from "@saptm/rpc/billing";
import { type RpcFailure, rpcGet, rpcPost } from "./rpc-server";

/** Shape the billing overview API actually returns (nested). */
type BillingOverviewData = {
  subscription: import("@saptm/rpc").BillingSubscription | null;
  usage: import("@saptm/rpc").BillingUsage[];
  recentInvoices: import("@saptm/rpc").BillingInvoice[];
};

export type BillingOverviewResult =
  | ({
      status: "ok";
    } & BillingOverviewData)
  | RpcFailure;

export type BillingPlansResult =
  | {
      status: "ok";
      plans: import("@saptm/rpc").BillingPlan[];
    }
  | RpcFailure;

export type BillingCheckoutResult =
  | {
      status: "ok";
      url: string;
    }
  | RpcFailure;

export type BillingPortalResult =
  | {
      status: "ok";
      url: string;
    }
  | RpcFailure;

export async function getBillingOverview(): Promise<BillingOverviewResult> {
  const result = await rpcGet("/rpc/billing/overview", billingOverviewOutputSchema);

  if (result.status !== "ok") {
    return result;
  }

  const data = result.data as unknown as BillingOverviewData;

  return {
    status: "ok",
    subscription: data.subscription,
    usage: data.usage,
    recentInvoices: data.recentInvoices,
  };
}

export async function getPlans(): Promise<BillingPlansResult> {
  const result = await rpcGet("/rpc/billing/plans", billingPlansOutputSchema);

  if (result.status !== "ok") {
    return result;
  }

  const data = result.data as { plans: import("@saptm/rpc").BillingPlan[] };

  return {
    status: "ok",
    plans: data.plans,
  };
}

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
