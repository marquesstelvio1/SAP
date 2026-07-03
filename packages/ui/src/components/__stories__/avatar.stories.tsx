import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/150?u=default" alt="@user" />
      <AvatarFallback>US</AvatarFallback>
    </Avatar>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/150?u=avatar" alt="@avatar" />
      <AvatarFallback>AV</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackIcon: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AN</AvatarFallback>
    </Avatar>
  ),
};

export const Small: Story = {
  render: () => (
    <Avatar style={{ width: "var(--space-8)", height: "var(--space-8)" }}>
      <AvatarFallback style={{ fontSize: "0.75rem" }}>SM</AvatarFallback>
    </Avatar>
  ),
};

export const Large: Story = {
  render: () => (
    <Avatar style={{ width: "var(--space-14)", height: "var(--space-14)" }}>
      <AvatarFallback style={{ fontSize: "1.25rem" }}>LG</AvatarFallback>
    </Avatar>
  ),
};
