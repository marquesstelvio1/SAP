import type * as React from "react";

import { cn } from "../lib/utils.js";

const densityHeightMap = {
  comfortable: "min-h-[var(--density-comfortable-control-height)]",
  compact: "min-h-[var(--density-compact-control-height)]",
  operational: "min-h-[var(--density-operational-control-height)]",
} as const;

function Textarea({
  className,
  density = "comfortable",
  ...props
}: React.ComponentProps<"textarea"> & {
  density?: "comfortable" | "compact" | "operational";
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-panel outline-none transition-[color,box-shadow] duration-[var(--motion-duration-fast)] placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        densityHeightMap[density],
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
