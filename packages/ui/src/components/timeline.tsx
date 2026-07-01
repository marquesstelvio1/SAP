import { AlertTriangleIcon, CheckIcon, CircleIcon, DotIcon, XIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/utils.js";

const timelineStatusStyles = {
  completed: {
    dot: "border-success bg-success text-success-foreground",
    line: "bg-success/30",
    icon: <CheckIcon className="size-3" />,
  },
  current: {
    dot: "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20",
    line: "bg-primary/30",
    icon: <CircleIcon className="size-2 fill-current" />,
  },
  pending: {
    dot: "border-muted-foreground/30 bg-muted text-muted-foreground",
    line: "bg-border",
    icon: <DotIcon className="size-3" />,
  },
  error: {
    dot: "border-destructive bg-destructive text-destructive-foreground",
    line: "bg-destructive/30",
    icon: <XIcon className="size-3" />,
  },
  warning: {
    dot: "border-warning bg-warning text-warning-foreground",
    line: "bg-warning/30",
    icon: <AlertTriangleIcon className="size-3" />,
  },
} as const;

type TimelineStatus = keyof typeof timelineStatusStyles;

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="timeline" className={cn("flex flex-col", className)} {...props} />;
}

function TimelineItem({
  className,
  status = "pending",
  title,
  description,
  timestamp,
  children,
  ...props
}: React.ComponentProps<"li"> & {
  status?: TimelineStatus;
  title: string;
  description?: string;
  timestamp?: React.ReactNode;
}) {
  const styles = timelineStatusStyles[status];

  return (
    <li
      data-slot="timeline-item"
      className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
      {...props}
    >
      <div className="flex flex-col items-center">
        <span
          data-slot="timeline-dot"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
            styles.dot,
          )}
        >
          {styles.icon}
        </span>
        <div
          data-slot="timeline-line"
          className={cn("mt-1 w-0.5 flex-1 rounded-full last:hidden", styles.line)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span data-slot="timeline-title" className="font-medium text-sm leading-none">
            {title}
          </span>
          {timestamp ? (
            <span data-slot="timeline-timestamp" className="shrink-0 text-muted-foreground text-xs">
              {timestamp}
            </span>
          ) : null}
        </div>
        {description ? (
          <p data-slot="timeline-description" className="text-muted-foreground text-sm">
            {description}
          </p>
        ) : null}
        {children ? (
          <div data-slot="timeline-actions" className="mt-1">
            {children}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export type { TimelineStatus };
export { Timeline, TimelineItem };
