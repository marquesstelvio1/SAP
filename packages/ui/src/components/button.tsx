import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "../lib/utils.js";
import { Spinner } from "./spinner.js";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium outline-none transition-[color,background-color,border-color,text-decoration-color,fill,stroke] duration-[var(--motion-duration-fast)] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_[data-icon]]:pointer-events-none [&_[data-icon]]:size-4 [&_[data-icon]]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-panel hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-panel hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border border-input bg-background shadow-panel hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-panel hover:bg-secondary/80",
      },
      size: {
        default: "px-4 py-2 gap-2",
        sm: "px-3 gap-2",
        lg: "px-6 gap-2",
        icon: "size-9",
      },
      density: {
        comfortable: "h-[var(--density-comfortable-control-height)]",
        compact: "h-[var(--density-compact-control-height)]",
        operational: "h-[var(--density-operational-control-height)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      density: "compact",
    },
  },
);

function Button({
  className,
  variant,
  size,
  density,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Component = asChild ? Slot.Root : "button";
  const isDisabled = disabled || loading;

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size, density }), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" aria-hidden="true" /> : null}
      {children}
    </Component>
  );
}

Button.displayName = "Button";

export { Button, buttonVariants };
