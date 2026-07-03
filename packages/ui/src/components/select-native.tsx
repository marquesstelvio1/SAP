import type * as React from "react";

import { cn } from "../lib/utils.js";

const densityHeightMap = {
  comfortable: "h-[var(--density-comfortable-control-height)]",
  compact: "h-[var(--density-compact-control-height)]",
  operational: "h-[var(--density-operational-control-height)]",
} as const;

function SelectNative({
  className,
  density = "comfortable",
  ...props
}: React.ComponentProps<"select"> & {
  density?: "comfortable" | "compact" | "operational";
}) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "flex w-full min-w-0 appearance-none rounded-md border border-input bg-background px-3 py-1 text-base shadow-panel outline-none transition-[color,box-shadow] duration-[var(--motion-duration-fast)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        densityHeightMap[density],
        className,
      )}
      {...props}
    />
  );
}
SelectNative.displayName = "SelectNative";

export { SelectNative };
