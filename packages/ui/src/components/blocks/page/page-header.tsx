import type { ReactNode } from "react";

import { cn } from "../../../lib/utils.js";

type PageHeaderSize = "sm" | "md";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: PageHeaderSize;
  className?: string;
}

const headingMap: Record<PageHeaderSize, string> = {
  sm: "text-xl md:text-2xl",
  md: "text-2xl",
};

function PageHeader({ title, description, actions, size = "sm", className }: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className={cn("font-bold tracking-heading", headingMap[size])}>{title}</h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

PageHeader.displayName = "PageHeader";

export { PageHeader, type PageHeaderProps, type PageHeaderSize };
