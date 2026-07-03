import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ShieldBan } from "lucide-react";

import { cn } from "../lib/utils.js";
import { Badge } from "./badge.js";
import { Button } from "./button.js";
import { Card } from "./card.js";

export type AccessStateProps = {
  actionHref?: string;
  actionLabel?: string;
  badgeLabel?: string;
  className?: string;
  description?: string;
  granted?: boolean;
  icon?: LucideIcon;
  label?: string;
  role?: "alert";
  title?: string;
  variant?: "blocked" | "empty" | "error";
  children?: ReactNode;
};

const defaultActionByVariant = {
  error: { label: "Contactar suporte", href: "mailto:suporte@saptm.pt" },
  blocked: { label: "Gerir acessos", href: "/app/admin" },
  empty: { label: "", href: undefined as string | undefined },
} as const;

export function AccessState({
  actionHref,
  actionLabel,
  badgeLabel,
  className,
  description,
  granted,
  icon: Icon = ShieldBan,
  label,
  role,
  title,
  variant = "blocked",
  children,
}: AccessStateProps) {
  if (granted !== undefined) {
    return (
      <div className={cn("flex items-center gap-2", className)} role={role}>
        {label && <span className="text-muted-foreground text-sm">{label}</span>}
        <Badge variant={granted ? "success" : "outline"}>
          {granted ? "Autorizado" : "Indisponivel"}
        </Badge>
      </div>
    );
  }

  const resolvedActionHref = actionHref ?? defaultActionByVariant[variant]?.href;
  const resolvedActionLabel = actionLabel ?? defaultActionByVariant[variant]?.label;

  return (
    <Card
      className="flex flex-col items-center justify-center gap-4 p-8"
      role={role}
      aria-live={role === "alert" ? "assertive" : undefined}
      tabIndex={role === "alert" ? -1 : undefined}
    >
      {badgeLabel && (
        <span className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-uppercase">
          {badgeLabel}
        </span>
      )}
      <Icon
        className={cn(
          "size-12",
          variant === "error"
            ? "text-destructive"
            : variant === "empty"
              ? "text-muted-foreground"
              : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <div className="text-center">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
        {children ? (
          <div className="mt-4">{children}</div>
        ) : resolvedActionHref ? (
          <div className="mt-4">
            <Button asChild variant="outline">
              <a
                href={resolvedActionHref}
                aria-label={resolvedActionLabel || undefined}
              >
                {resolvedActionLabel}
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

AccessState.displayName = "AccessState";
