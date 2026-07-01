import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "success", "warning", "info"],
    },
    density: {
      control: "select",
      options: ["comfortable", "compact", "operational"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Destructive: Story = {
  args: {
    children: "Deleted",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Draft",
    variant: "outline",
  },
};

export const Success: Story = {
  args: {
    children: "Active",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Pending",
    variant: "warning",
  },
};

export const Info: Story = {
  args: {
    children: "Updated",
    variant: "info",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
