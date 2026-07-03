import { Badge } from "@saptm/ui";

type BadgeVariant =
  | "default"
  | "destructive"
  | "info"
  | "outline"
  | "secondary"
  | "success"
  | "warning";

export type PlanBadgeProps = {
  plan: string;
};

const planVariantMap: Record<string, BadgeVariant> = {
  free: "outline",
  pro: "info",
  enterprise: "warning",
};

const planLabelMap: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

/**
 * PlanBadge — badge visual "Free" / "Pro" / "Enterprise"
 * Conforme spec visual: docs/design/ui-specs/billing-overview.md
 *
 * Cores por plano:
 * - Free: outline (neutral)
 * - Pro: info (blue)
 * - Enterprise: warning (amber/purple)
 */
export function PlanBadge({ plan }: PlanBadgeProps) {
  return <Badge variant={planVariantMap[plan] ?? "outline"}>{planLabelMap[plan] ?? plan}</Badge>;
}
