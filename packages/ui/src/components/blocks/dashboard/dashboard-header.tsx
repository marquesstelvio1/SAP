import type { ReactNode } from "react";

import { cn } from "../../../lib/utils.js";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

function DashboardHeader({ title, description, actions, className }: DashboardHeaderProps) {
  return (
    <div
      data-slot="dashboard-header"
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

DashboardHeader.displayName = "DashboardHeader";

export { DashboardHeader, type DashboardHeaderProps };
