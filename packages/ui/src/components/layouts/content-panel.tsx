import type { ReactNode } from "react";

import { cn } from "../../lib/utils.js";

interface ContentPanelProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

function ContentPanel({ children, className, narrow = false }: ContentPanelProps) {
  return (
    <div
      data-slot="content-panel"
      className={cn(
        "mx-auto flex w-full flex-col gap-6",
        narrow ? "max-w-3xl" : "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

ContentPanel.displayName = "ContentPanel";

export { ContentPanel, type ContentPanelProps };
