import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "../lib/utils.js";
import { Spinner } from "./spinner.js";

const densityHeightMap = {
  comfortable: "h-[var(--density-comfortable-control-height)]",
  compact: "h-[var(--density-compact-control-height)]",
  operational: "h-[var(--density-operational-control-height)]",
} as const;

const sizeStyles: Record<string, React.CSSProperties> = {
  default: {
    paddingLeft: "var(--space-4)",
    paddingRight: "var(--space-4)",
    paddingTop: "var(--space-2)",
    paddingBottom: "var(--space-2)",
    gap: "var(--space-2)",
  },
  sm: {
    paddingLeft: "var(--space-3)",
    paddingRight: "var(--space-3)",
    gap: "var(--space-2)",
  },
  lg: {
    paddingLeft: "var(--space-6)",
    paddingRight: "var(--space-6)",
    gap: "var(--space-2)",
  },
  icon: {
    width: "var(--space-9)",
    height: "var(--space-9)",
  },
};

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
        default: "",
        icon: "",
        lg: "",
        sm: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  density = "compact",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    density?: "comfortable" | "compact" | "operational";
    loading?: boolean;
  }) {
  const Component = asChild ? Slot.Root : "button";
  const resolvedSize = size ?? "default";
  const isDisabled = disabled || loading;

  return (
    <Component
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        size !== "icon" && densityHeightMap[density],
        className,
      )}
      style={sizeStyles[resolvedSize]}
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
