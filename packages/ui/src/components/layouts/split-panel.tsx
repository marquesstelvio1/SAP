import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";

interface SplitPanelProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  ratio?: "1:1" | "1:2" | "2:1" | "1:3" | "3:1";
}

const ratioMap = {
  "1:1": "lg:grid-cols-2",
  "1:2": "lg:grid-cols-[1fr_2fr]",
  "2:1": "lg:grid-cols-[2fr_1fr]",
  "1:3": "lg:grid-cols-[1fr_3fr]",
  "3:1": "lg:grid-cols-[3fr_1fr]",
} as const;

function SplitPanel({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
  ratio = "1:1",
}: SplitPanelProps) {
  return (
    <div data-slot="split-panel" className={cn("grid gap-6", ratioMap[ratio], className)}>
      <div className={cn("min-w-0", leftClassName)}>{left}</div>
      <div className={cn("min-w-0", rightClassName)}>{right}</div>
    </div>
  );
}

SplitPanel.displayName = "SplitPanel";

export { SplitPanel, type SplitPanelProps };
