import type { ComponentProps } from "react";

import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Card } from "./card.js";

export type MetricTileProps = ComponentProps<typeof Card> & {
  badge?: string;
  label: string;
  trend?: { direction: "up" | "down"; value: string };
  value: string | number;
  variant?: "default" | "info" | "success" | "warning" | "destructive" | "outline" | "secondary";
};

export function MetricTile({
  badge,
  label,
  trend,
  value,
  variant = "default",
  className,
  ...props
}: MetricTileProps) {
  return (
    <Card className={cn("p-4", className)} {...props}>
      <p className="text-muted-foreground text-sm">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-2xl font-bold">{value}</p>
        {badge && <Badge variant={variant}>{badge}</Badge>}
      </div>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs",
            trend.direction === "up" ? "text-success" : "text-destructive",
          )}
        >
          {trend.value}
        </p>
      )}
    </Card>
  );
}
