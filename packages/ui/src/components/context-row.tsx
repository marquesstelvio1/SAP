import type { ReactNode } from "react";

import { cn } from "../lib/utils.js";

export type ContextRowProps = {
  className?: string;
  description?: ReactNode;
  label: string;
  muted?: boolean;
  value: ReactNode;
};

export function ContextRow({
  className,
  description,
  label,
  muted = true,
  value,
}: ContextRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2",
        muted && "bg-muted/30",
        className,
      )}
    >
      <div>
        <span className="text-muted-foreground text-sm">{label}</span>
        {description && <p className="text-muted-foreground/70 mt-0.5 text-xs">{description}</p>}
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
