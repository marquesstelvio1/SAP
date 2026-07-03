import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "../lib/utils.js";

const densityPaddingMap = {
  comfortable: "h-[var(--density-comfortable-control-height)] px-3 py-1",
  compact: "h-[var(--density-compact-control-height)] px-2 py-0.5",
  operational: "h-[var(--density-operational-control-height)] px-1.5 py-0.5",
} as const;

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border text-xs font-medium whitespace-nowrap transition-[color,background-color,border-color,text-decoration-color,fill,stroke] duration-[var(--motion-duration-fast)] [&_[data-icon]]:pointer-events-none [&_[data-icon]]:size-3 [&_[data-icon]]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        info: "border-transparent bg-info text-info-foreground",
        outline: "text-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  density = "compact",
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    density?: "comfortable" | "compact" | "operational";
  }) {
  const Component = asChild ? Slot.Root : "span";

  return (
    <Component
      data-slot="badge"
      className={cn(badgeVariants({ variant }), densityPaddingMap[density], className)}
      {...props}
    />
  );
}

Badge.displayName = "Badge";

export { Badge, badgeVariants };
