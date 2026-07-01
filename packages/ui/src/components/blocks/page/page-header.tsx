import type { ReactNode } from "react";

import { cn } from "../../../lib/utils.js";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

PageHeader.displayName = "PageHeader";

export { PageHeader, type PageHeaderProps };
