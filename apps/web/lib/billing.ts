import { billingOverviewOutputSchema, billingPlansOutputSchema } from "@saptm/rpc/billing";
import { type RpcFailure, rpcGet } from "./rpc-server";

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
