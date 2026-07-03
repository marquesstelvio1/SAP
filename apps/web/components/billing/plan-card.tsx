"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@saptm/ui";
import { CheckIcon, XIcon } from "lucide-react";

export type PlanFeature = {
  key: string;
  label: string;
  included: boolean;
  limit?: string;
};

export type Plan = {
  id: string;
  slug: string;
  name: string;
  label: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: PlanFeature[];
  isPopular?: boolean;
};

export type PlanCardProps = {
  plan: Plan;
  isCurrentPlan: boolean;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
};

/**
 * PlanCard — cartão de plano para página de subscrição.
 * Conforme spec visual: docs/design/ui-specs/subscription-management.md
 *
 * Estados:
 * - Plano atual: highlighted border + "Plano atual" badge
 * - Free: "Gratuito" price, upgrade CTA
 * - Pro: "Popular" badge, upgrade CTA
 * - Enterprise: "Sob consulta" price, contact CTA
 */
export function PlanCard({
  plan,
  isCurrentPlan,
  onAction,
  actionLabel,
  actionDisabled,
}: PlanCardProps) {
  const formattedPrice = formatPrice(plan.price, plan.currency);

  return (
    <Card
      className={`flex flex-col ${isCurrentPlan ? "border-primary ring-1 ring-primary" : ""}`}
      data-slot="plan-card"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.label || plan.name}</CardTitle>
          <div className="flex items-center gap-2">
            {isCurrentPlan ? (
              <Badge variant="default" density="compact">
                Plano atual
              </Badge>
            ) : null}
            {plan.isPopular ? (
              <Badge variant="info" density="compact">
                Popular
              </Badge>
            ) : null}
          </div>
        </div>
        <CardDescription>{plan.description ?? ""}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold">Gratuito</span>
          ) : plan.slug === "enterprise" && plan.price === 0 ? (
            <span className="text-3xl font-bold">Sob consulta</span>
          ) : (
            <>
              <span className="text-3xl font-bold">{formattedPrice}</span>
              <span className="text-muted-foreground text-sm">
                /{plan.interval === "month" ? "mês" : "ano"}
              </span>
            </>
          )}
        </div>
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature.key} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={feature.included ? "" : "text-muted-foreground/60"}>
                {feature.label}
                {feature.limit ? (
                  <span className="ml-1 text-muted-foreground">({feature.limit})</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full" disabled>
            Plano atual
          </Button>
        ) : (
          <Button variant="default" className="w-full" onClick={onAction} disabled={actionDisabled}>
            {actionLabel ?? "Selecionar"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Grátis";
  const value = (cents / 100).toFixed(2).replace(".", ",");
  return `${value} ${currency.toUpperCase()}`;
}
