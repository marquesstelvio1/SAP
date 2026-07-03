import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonCard, SkeletonMetricTile, SkeletonTable } from "../skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", width: 300 }}>
      <Skeleton style={{ width: 80, height: 16 }} />
      <Skeleton style={{ height: 36 }} />
      <Skeleton style={{ width: 120, height: 12 }} />
    </div>
  ),
};

export const Text: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", width: 300 }}>
      <Skeleton style={{ height: 16, width: "100%" }} />
      <Skeleton style={{ height: 16, width: "85%" }} />
      <Skeleton style={{ height: 16, width: "70%" }} />
    </div>
  ),
};

export const AvatarWithText: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", width: 300 }}>
      <Skeleton style={{ width: 40, height: 40, borderRadius: "9999px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", flex: 1 }}>
        <Skeleton style={{ height: 14, width: "60%" }} />
        <Skeleton style={{ height: 12, width: "40%" }} />
      </div>
    </div>
  ),
};

export const Card: Story = {
  render: () => <SkeletonCard style={{ width: 300 }} />,
};

export const MetricTile: Story = {
  render: () => <SkeletonMetricTile style={{ width: 220 }} />,
};

export const Table: Story = {
  render: () => <SkeletonTable rows={4} columns={3} className="w-[500px]" />,
};
