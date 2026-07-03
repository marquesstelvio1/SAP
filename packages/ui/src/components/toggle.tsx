"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../lib/utils.js";

const toggleVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium outline-none transition-[color,background-color,border-color,text-decoration-color,fill,stroke] duration-[var(--motion-duration-fast)] hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-panel hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-[var(--density-compact-control-height)] px-3",
        sm: "h-[var(--density-operational-control-height)] px-2",
        lg: "h-[var(--density-comfortable-control-height)] px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
}

Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };
