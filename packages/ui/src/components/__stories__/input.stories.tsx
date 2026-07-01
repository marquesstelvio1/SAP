import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url", "search"],
    },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter value…",
    type: "text",
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: "Some value",
    type: "text",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
    defaultValue: "supersecret",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    placeholder: "Required field",
    required: true,
  },
};

export const WithError: Story = {
  args: {
    placeholder: "Invalid input",
    "aria-invalid": true,
  },
};
