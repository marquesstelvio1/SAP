"use client";

import type * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      data-slot="toaster"
      className="group"
      toastOptions={{
        classNames: {
          toast:
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-panel group-[.toaster]:rounded-lg group-[.toaster]:p-4 group-[.toaster]:gap-2",
          description: "group-[.toast]:text-muted-foreground text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          icon: "group-[.toast]:size-4",
          error: "group-[.toaster]:border-destructive/50",
          success: "group-[.toaster]:border-success/50",
          warning: "group-[.toaster]:border-warning/50",
          info: "group-[.toaster]:border-info/50",
        },
      }}
      {...props}
    />
  );
}

const toast: typeof sonnerToast = sonnerToast;

export { Toaster, toast };
