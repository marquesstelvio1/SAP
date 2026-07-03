import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { getServerEnv } from "@saptm/config";
import type { DomainEvent } from "@saptm/database";
import Stripe from "stripe";

import { EventBusService } from "../event-bus/event-bus.service.js";
import type { BillingRepository } from "./domain/billing.repository.js";
import { BILLING_REPOSITORY } from "./domain/billing.repository.js";

// Stripe v18.5.0 types omit current_period_start/current_period_end at Subscription level
// but the API response still includes them.
type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

@Injectable()
export class BillingService {
  private stripe: Stripe | null = null;

  constructor(
    @Inject(BILLING_REPOSITORY)
    private readonly billingRepo: BillingRepository,
    private readonly eventBus: EventBusService,
  ) {}

  private getStripe(): Stripe {
    if (!this.stripe) {
      const env = getServerEnv();
      if (!env.STRIPE_SECRET_KEY) {
        throw new InternalServerErrorException("Stripe nao configurado");
      }
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });
    }
    return this.stripe;
  }

  async createOrGetCustomer(organizationId: string): Promise<string> {
    const org = await this.billingRepo.findOrganizationWithDetails(organizationId);

    if (!org) throw new NotFoundException("organizacao.nao_encontrada");

    if (org.subscription?.stripeCustomerId) {
      return org.subscription.stripeCustomerId;
    }

    const ownerMembership = org.memberships[0];
    const customer = await this.getStripe().customers.create({
      name: org.name,
      ...(ownerMembership?.user.email ? { email: ownerMembership.user.email } : {}),
      metadata: { organizationId: org.id },
    });

    await this.billingRepo.upsertSubscription(organizationId, {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null,
      plan: "free",
      status: "active",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    });

    return customer.id;
  }

  async createCheckoutSession(
    organizationId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    const customerId = await this.createOrGetCustomer(organizationId);

    const session = await this.getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { organizationId },
      subscription_data: {
        metadata: { organizationId },
      },
    });

    if (!session.url) {
      throw new InternalServerErrorException("erro.criar_sessao_checkout");
    }

    return { url: session.url };
  }

  async createPortalSession(organizationId: string): Promise<{ url: string }> {
    const customerId = await this.createOrGetCustomer(organizationId);
    const env = getServerEnv();

    const session = await this.getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/app/configuracoes/assinatura`,
    });

    return { url: session.url };
  }

  async getSubscription(organizationId: string) {
    const subscription = await this.billingRepo.findSubscription(organizationId);

    if (!subscription) throw new NotFoundException("assinatura.nao_encontrada");

    return {
      id: subscription.id,
      plan: subscription.plan as "free" | "pro" | "enterprise",
      status: subscription.status as "active" | "past_due" | "canceled" | "unpaid" | "trialing",
      currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  async getInvoices(organizationId: string, limit = 10) {
    const invoices = await this.billingRepo.findInvoices(organizationId, limit);

    return invoices.map((inv) => ({
      id: inv.id,
      stripeInvoiceId: inv.stripeInvoiceId,
      amount: inv.amount,
      currency: inv.currency,
      status: inv.status as "paid" | "open" | "void" | "uncollectible",
      periodStart: inv.periodStart?.toISOString() ?? null,
      periodEnd: inv.periodEnd?.toISOString() ?? null,
      paidAt: inv.paidAt?.toISOString() ?? null,
      downloadUrl: inv.downloadUrl,
      createdAt: inv.createdAt.toISOString(),
    }));
  }

  private readonly metricDisplayLabels: Record<string, { displayLabel: string; unit?: string }> = {
    members: { displayLabel: "Membros", unit: "/mês" },
    cargo_shipments: { displayLabel: "Cargas", unit: "/mês" },
    tracking_events: { displayLabel: "Eventos de tracking", unit: "/mês" },
  };

  async getUsage(organizationId: string) {
    const records = await this.billingRepo.findUsageRecords(organizationId);

    const metricConfig: Array<{
      metric: "members" | "cargo_shipments" | "tracking_events";
    }> = [{ metric: "members" }, { metric: "cargo_shipments" }, { metric: "tracking_events" }];

    return {
      metrics: metricConfig.map(({ metric }) => {
        const record = records.find((r) => r.metric === metric);
        const displayInfo = this.metricDisplayLabels[metric] ?? {
          displayLabel: metric,
        };
        return {
          metric,
          current: record?.current ?? 0,
          limit: record?.limit ?? 0,
          remaining: Math.max(0, (record?.limit ?? 0) - (record?.current ?? 0)),
          displayLabel: displayInfo.displayLabel,
          unit: displayInfo.unit,
        };
      }),
    };
  }

  async getSubscriptionDetail(organizationId: string) {
    const [subscription, usage] = await Promise.all([
      this.getSubscription(organizationId).catch(() => null),
      this.getUsage(organizationId),
    ]);

    if (!subscription) throw new NotFoundException("assinatura.nao_encontrada");

    return {
      subscription: {
        ...subscription,
        usage: usage.metrics,
      },
    };
  }

  async getUsageDetail(organizationId: string) {
    return this.getUsage(organizationId);
  }

  async getInvoicesList(organizationId: string, limit: number, offset: number) {
    const invoices = await this.billingRepo.findInvoices(organizationId, limit, offset);
    const totalCount = await this.billingRepo.countInvoices(organizationId);

    return {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        stripeInvoiceId: inv.stripeInvoiceId,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status as "paid" | "open" | "void" | "uncollectible",
        periodStart: inv.periodStart?.toISOString() ?? null,
        periodEnd: inv.periodEnd?.toISOString() ?? null,
        paidAt: inv.paidAt?.toISOString() ?? null,
        downloadUrl: inv.downloadUrl,
        createdAt: inv.createdAt.toISOString(),
      })),
      pagination: {
        totalCount,
        limit,
        offset,
      },
    };
  }

  async getOverview(organizationId: string) {
    const [subscription, usage] = await Promise.all([
      this.getSubscription(organizationId).catch(() => null),
      this.getUsage(organizationId),
    ]);

    const memberMetric = usage.metrics.find((m) => m.metric === "members");
    const cargoMetric = usage.metrics.find((m) => m.metric === "cargo_shipments");
    const trackingMetric = usage.metrics.find((m) => m.metric === "tracking_events");

    return {
      plan: subscription?.plan ?? "free",
      status: subscription?.status ?? "active",
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      trialEndsAt: subscription?.trialEndsAt ?? null,
      memberUsage: memberMetric?.current ?? 0,
      memberLimit: memberMetric?.limit ?? 0,
      cargoUsage: cargoMetric?.current ?? 0,
      cargoLimit: cargoMetric?.limit ?? 0,
      trackingUsage: trackingMetric?.current ?? 0,
      trackingLimit: trackingMetric?.limit ?? 0,
    };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const env = getServerEnv();
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new InternalServerErrorException("Webhook nao configurado");
    }

    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new InternalServerErrorException("assinatura.webhook_invalida");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        if (!orgId) break;

        const subscriptionId = session.subscription as string;
        if (subscriptionId) {
          const rawSub = await this.getStripe().subscriptions.retrieve(subscriptionId);
          const sub = rawSub as unknown as SubscriptionWithPeriod;
          const newPlan = this.resolvePlanFromPrice(sub.items.data[0]?.price.id);
          await this.billingRepo.upsertSubscription(orgId, {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            plan: newPlan,
            status: sub.status,
            currentPeriodStart: sub.current_period_start
              ? new Date(sub.current_period_start * 1000)
              : null,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          });

          this.emitSubscriptionEvent("billing.subscription.created", orgId, newPlan);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const orgId =
          invoice.metadata?.organizationId ??
          invoice.parent?.subscription_details?.metadata?.organizationId;
        if (!orgId) {
          const subId = invoice.parent?.subscription_details?.subscription as string;
          if (subId) {
            const sub = await this.billingRepo.findSubscriptionByStripeId(subId);
            if (sub) {
              await this.billingRepo.createInvoice({
                organizationId: sub.organizationId,
                stripeInvoiceId: invoice.id ?? "",
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: "paid",
                periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
                periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
                paidAt: invoice.status_transitions?.paid_at
                  ? new Date(invoice.status_transitions.paid_at * 1000)
                  : null,
                downloadUrl: invoice.invoice_pdf ?? null,
              });
            }
          }
          break;
        }

        await this.billingRepo.createInvoice({
          organizationId: orgId,
          stripeInvoiceId: invoice.id ?? "",
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: "paid",
          periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
          downloadUrl: invoice.invoice_pdf ?? null,
        });
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const failedOrgId =
          failedInvoice.metadata?.organizationId ??
          failedInvoice.parent?.subscription_details?.metadata?.organizationId;
        if (failedOrgId) {
          await this.billingRepo.updateSubscriptionStatus(failedOrgId, "past_due");

          await this.billingRepo.createInvoice({
            organizationId: failedOrgId,
            stripeInvoiceId: failedInvoice.id ?? "",
            amount: failedInvoice.amount_due,
            currency: failedInvoice.currency,
            status: "open",
            periodStart: failedInvoice.period_start
              ? new Date(failedInvoice.period_start * 1000)
              : null,
            periodEnd: failedInvoice.period_end ? new Date(failedInvoice.period_end * 1000) : null,
            paidAt: null,
            downloadUrl: null,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subEvent = event.data.object as unknown as SubscriptionWithPeriod;
        const subOrgId = subEvent.metadata?.organizationId;

        if (subOrgId) {
          const plan =
            event.type === "customer.subscription.deleted"
              ? "free"
              : this.resolvePlanFromPrice(subEvent.items.data[0]?.price.id);
          const status =
            event.type === "customer.subscription.deleted" ? "canceled" : subEvent.status;

          // SECURITY: Preserve existing stripeCustomerId — do NOT set to null
          // on subscription updates. Nullifying it would orphan the Stripe customer
          // record and break billing portal session creation.
          const existingSubscription =
            await this.billingRepo.findSubscription(subOrgId);

          await this.billingRepo.upsertSubscription(subOrgId, {
            stripeCustomerId: existingSubscription?.stripeCustomerId ?? subEvent.customer as string | null,
            stripeSubscriptionId: subEvent.id,
            plan,
            status,
            currentPeriodStart: subEvent.current_period_start
              ? new Date(subEvent.current_period_start * 1000)
              : null,
            currentPeriodEnd: subEvent.current_period_end
              ? new Date(subEvent.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: subEvent.cancel_at_period_end,
            trialEndsAt: subEvent.trial_end ? new Date(subEvent.trial_end * 1000) : null,
          });

          const subEventType =
            event.type === "customer.subscription.deleted"
              ? "billing.subscription.deleted"
              : "billing.subscription.updated";
          this.emitSubscriptionEvent(subEventType, subOrgId, plan);
        }
        break;
      }
    }
  }

  private emitSubscriptionEvent(
    eventType: string,
    organizationId: string,
    plan: string,
  ): void {
    const event: DomainEvent = {
      id: crypto.randomUUID(),
      eventType,
      aggregateType: "subscription",
      aggregateId: organizationId,
      organizationId,
      actorId: "stripe-webhook",
      actorType: "integration",
      payload: { plan, eventType },
      metadata: { source: "stripe-webhook" },
      correlationId: crypto.randomUUID(),
      occurredAt: new Date(),
    };
    this.eventBus.emit(event);
  }

  private resolvePlanFromPrice(priceId?: string): string {
    if (!priceId) return "free";
    const env = getServerEnv();
    if (priceId === env.STRIPE_PRICE_FREE) return "free";
    if (priceId === env.STRIPE_PRICE_PRO) return "pro";
    if (priceId === env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
    // SECURITY: Unknown price IDs must NOT escalate to a paid tier.
    // If Stripe sends a price ID that doesn't match any configured env var,
    // default to "free" instead of "pro" to prevent privilege escalation.
    console.warn(
      `[BILLING] Unknown price ID "${priceId}" — defaulting to "free" plan. ` +
        `Check STRIPE_PRICE_* environment variables.`,
    );
    return "free";
  }
}
