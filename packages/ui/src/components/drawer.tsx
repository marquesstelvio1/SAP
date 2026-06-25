"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { Dialog as DrawerPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../lib/utils.js";

function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-overlay bg-background/80 backdrop-blur-sm transition-opacity duration-[var(--motion-duration-normal)] data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

const densityWidthMap = {
  comfortable: "w-[var(--density-comfortable-drawer-width,20rem)]",
  compact: "w-[var(--density-compact-drawer-width,18rem)]",
  operational: "w-[var(--density-operational-drawer-width,16rem)]",
} as const;

const drawerVariants = cva(
  "fixed gap-0 bg-background p-0 shadow-overlay outline-none transition-transform duration-[var(--motion-duration-normal)]",
  {
    variants: {
      side: {
        left: "inset-y-0 left-0 h-full border-r data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
        right:
          "inset-y-0 right-0 h-full border-l data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
      },
      density: {
        comfortable: densityWidthMap.comfortable,
        compact: densityWidthMap.compact,
        operational: densityWidthMap.operational,
      },
    },
    defaultVariants: {
      side: "right",
      density: "compact",
    },
  },
);

function DrawerContent({
  side = "right",
  density = "compact",
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> &
  VariantProps<typeof drawerVariants> & {
    showCloseButton?: boolean;
  }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(drawerVariants({ side, density, className }))}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DrawerPrimitive.Close
            data-slot="drawer-close-button"
            className="absolute top-4 right-4 rounded-xs opacity-70 outline-none transition-opacity duration-[var(--motion-duration-fast)] hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4"
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DrawerPrimitive.Close>
        ) : null}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1 border-b px-6 py-4", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("flex flex-col gap-2 border-t px-6 py-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-lg tracking-tight", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
  drawerVariants,
};
