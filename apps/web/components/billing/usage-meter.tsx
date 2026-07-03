"use client";

import { cn } from "@saptm/ui/lib/utils";

export type UsageMeterProps = {
  label: string;
  current: number;
  limit: number;
  format?: "number" | "percentage";
  showWarning?: boolean;
  className?: string;
};

/**
 * UsageMeter — barra de progresso visual current/limit com cores semânticas.
 * 0-79%: success (green)
 * 80-99%: warning (amber)
 * 100%+: destructive (red)
 *
 * Conforme spec visual: docs/design/ui-specs/billing-overview.md
 */
export function UsageMeter({
  label,
  current,
  limit,
  format = "percentage",
  showWarning = true,
  className,
}: UsageMeterProps) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isOverLimit = limit > 0 && current >= limit;
  const isNearLimit = limit > 0 && current / limit >= 0.8 && !isOverLimit;
  const valueDisplay =
    format === "percentage"
      ? `${Math.round(pct)}%`
      : `${current.toLocaleString("pt-PT")} / ${limit.toLocaleString("pt-PT")}`;

  const barColor = isOverLimit ? "bg-destructive" : isNearLimit ? "bg-warning" : "bg-success";

  const labelColor = isOverLimit
    ? "text-destructive"
    : isNearLimit
      ? "text-warning"
      : "text-foreground";

  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-label={`${label}: ${current} de ${limit}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className={cn("text-xs font-medium", labelColor)}>
          {valueDisplay}
          {isOverLimit && showWarning ? " (excedido)" : ""}
          {isNearLimit && showWarning ? " (próximo do limite)" : ""}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
