import type * as React from "react";

import { cn } from "../lib/utils.js";
import { Label } from "./label.js";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="fieldset"
      className={cn("flex min-w-0 flex-col gap-6", className)}
      {...props}
    />
  );
}

function FieldLegend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="field-legend"
      className={cn("mb-3 font-medium text-foreground text-sm", className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-group" className={cn("flex flex-col gap-4", className)} {...props} />
  );
}

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        "group/field flex w-full gap-2 data-[disabled=true]:opacity-50 data-[orientation=horizontal]:items-start data-[orientation=horizontal]:gap-4 data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "flex items-center gap-2 font-medium text-sm leading-none group-data-[disabled=true]/field:cursor-not-allowed group-data-[disabled=true]/field:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex flex-1 flex-col gap-1.5 leading-none", className)}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-title" className={cn("font-medium text-sm", className)} {...props} />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FieldSeparator({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      className={cn(
        "relative flex items-center gap-3 py-2 text-muted-foreground text-xs",
        className,
      )}
      {...props}
    >
      <div className="h-px flex-1 bg-border" />
      {children ? <span className="shrink-0">{children}</span> : null}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const message = children ?? errors?.find((error) => error?.message)?.message;

  if (!message) {
    return null;
  }

  return (
    <div data-slot="field-error" className={cn("text-destructive text-sm", className)} {...props}>
      {message}
    </div>
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};
