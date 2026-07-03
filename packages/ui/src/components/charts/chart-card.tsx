import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";
import { Button } from "../button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card.js";
import { Skeleton } from "../skeleton.js";

type ChartCardSize = "sm" | "md" | "lg";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  size?: ChartCardSize;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
}

const heightMap: Record<ChartCardSize, string> = {
  sm: "min-h-[200px]",
  md: "min-h-[300px]",
  lg: "min-h-[400px]",
};

function ChartCard({
  title,
  description,
  children,
  size = "md",
  loading = false,
  empty = false,
  emptyMessage = "Sem dados disponíveis.",
  error = false,
  errorMessage = "Falha ao carregar o gráfico.",
  onRetry,
  action,
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card data-slot="chart-card" className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </CardHeader>
      <CardContent
        className={cn("flex flex-1 items-center justify-center", heightMap[size], contentClassName)}
      >
        {loading ? (
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-[calc(100%-2rem)] w-full flex-1" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-destructive text-sm">{errorMessage}</p>
            {onRetry ? (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Tentar novamente
              </Button>
            ) : null}
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

ChartCard.displayName = "ChartCard";

export { ChartCard, type ChartCardProps, type ChartCardSize };
