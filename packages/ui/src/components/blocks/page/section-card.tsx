import type { ReactNode } from "react";

import { cn } from "../../../lib/utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../card.js";
import { Skeleton } from "../../skeleton.js";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
  contentClassName?: string;
}

function SectionCard({
  title,
  description,
  children,
  action,
  loading = false,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card data-slot="section-card" className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </CardHeader>
      <CardContent className={contentClassName}>
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

SectionCard.displayName = "SectionCard";

export { SectionCard, type SectionCardProps };
