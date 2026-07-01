import type { LucideIcon } from "lucide-react";
import { ShieldBan } from "lucide-react";

import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Card } from "./card.js";

export type AccessStateProps = {
  badgeLabel?: string;
  className?: string;
  description?: string;
  granted?: boolean;
  icon?: LucideIcon;
  label?: string;
  message?: string;
  role?: "alert";
  status?: string;
  title?: string;
  variant?: "blocked" | "empty" | "error";
};

export function AccessState({
  badgeLabel,
  className,
  description,
  granted,
  icon: Icon = ShieldBan,
  label,
  message,
  role,
  status,
  title,
  variant = "blocked",
}: AccessStateProps) {
  if (granted !== undefined) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {label && <span className="text-muted-foreground text-sm">{label}</span>}
        <Badge variant={granted ? "success" : "outline"}>
          {granted ? "Autorizado" : "Indisponivel"}
        </Badge>
      </div>
    );
  }

  return (
    <Card
      className="flex flex-col items-center justify-center gap-4 p-8"
      role={role}
      aria-live={role === "alert" ? "assertive" : undefined}
    >
      {badgeLabel && (
        <span className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-uppercase">
          {badgeLabel}
        </span>
      )}
      <Icon
        className={cn(
          "h-12 w-12",
          variant === "error"
            ? "text-destructive"
            : variant === "empty"
              ? "text-muted-foreground"
              : "text-muted-foreground/50",
        )}
      />
      <div className="text-center">
        {status && <p className="text-muted-foreground/60 mb-1 text-xs">{status}</p>}
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {(description ?? message) && (
          <p className="text-muted-foreground mt-1 text-sm">{description ?? message}</p>
        )}
      </div>
    </Card>
  );
}
