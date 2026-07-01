"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../lib/utils.js";

const densityHeightMap = {
  comfortable: "h-[var(--density-comfortable-control-height)]",
  compact: "h-[var(--density-compact-control-height)]",
  operational: "h-[var(--density-operational-control-height)]",
} as const;

function Tabs({ ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({
  className,
  density = "comfortable",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  density?: "comfortable" | "compact" | "operational";
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        densityHeightMap[density],
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm px-3 py-1 text-sm font-medium whitespace-nowrap outline-none transition-all duration-[var(--motion-duration-fast)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-panel",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-2 outline-none ring-offset-background focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
