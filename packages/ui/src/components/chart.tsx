"use client";

import type * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "../lib/utils.js";

type ChartConfig = Record<
  string,
  {
    label: string;
    color?: string;
  }
>;

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig;
}

function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
  return (
    <div
      data-slot="chart"
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid-horizontal]:opacity-20 [&_.recharts-cartesian-grid-vertical]:opacity-20",
        className,
      )}
      style={
        {
          "--color-chart-base": "var(--color-chart-1)",
          ...Object.fromEntries(
            Object.entries(config).map(([key, val]) => [
              `--color-${key}`,
              val.color ?? "var(--color-chart-1)",
            ]),
          ),
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: { name?: string; value?: number; dataKey?: string; fill?: string }[];
  label?: string;
  config?: ChartConfig;
  hideLabel?: boolean;
  indicator?: "line" | "dot" | "dashed";
}

function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  hideLabel,
  indicator = "dot",
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-overlay">
      {!hideLabel && label ? (
        <div className="mb-1 font-medium text-foreground text-xs">{label}</div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {payload.map((item) => {
          const key = item.dataKey ?? item.name ?? "";
          const itemConfig = config?.[key];
          const color = item.fill ?? `var(--color-${key})`;

          return (
            <div key={key} className="flex items-center gap-1.5 text-muted-foreground text-xs">
              {indicator === "line" ? (
                <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
              ) : indicator === "dashed" ? (
                <div
                  className="h-0.5 w-4 rounded-full border-0"
                  style={{ borderTop: `2px dashed ${color}` }}
                />
              ) : (
                <div className="size-2 rounded-full" style={{ backgroundColor: color }} />
              )}
              <span>{itemConfig?.label ?? key}</span>
              <span className="ml-auto font-medium text-foreground">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  type ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
};
