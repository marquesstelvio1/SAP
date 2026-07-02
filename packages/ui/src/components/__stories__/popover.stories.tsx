import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div style={{ fontSize: "0.875rem" }}>
          <p style={{ margin: 0, fontWeight: 600, marginBottom: "var(--space-1)" }}>
            Dimensions
          </p>
          <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
            Set the dimensions for the layer.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const Form: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">Edit Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: 280 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", marginBottom: "var(--space-1)" }}>
              Dimensions
            </p>
            <p style={{ margin: 0, color: "var(--muted-foreground)", fontSize: "0.75rem" }}>
              Set the width and height of the layer.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <div style={{ flex: 1 }}>
              <Label htmlFor="width">Width</Label>
              <Input id="width" defaultValue="100%" />
            </div>
            <div style={{ flex: 1 }}>
              <Label htmlFor="height">Height</Label>
              <Input id="height" defaultValue="auto" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
