import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    checked: {
      control: "select",
      options: [true, false, "indeterminate"],
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    checked: "indeterminate" as const,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <label
      htmlFor="terms"
      style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}
    >
      <Checkbox id="terms" />
      <span style={{ fontSize: "var(--space-3.5)" }}>Accept terms and conditions</span>
    </label>
  ),
};
