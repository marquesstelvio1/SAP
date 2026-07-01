import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "../spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <Spinner />
      <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Loading…</span>
    </div>
  ),
};

export const FullPage: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "var(--space-4)",
      }}
    >
      <Spinner />
      <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
        Loading dashboard data…
      </span>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <button
      type="button"
      disabled
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-4)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--primary)",
        color: "var(--primary-foreground)",
        cursor: "not-allowed",
        opacity: 0.5,
      }}
    >
      <span style={{ width: 16, height: 16, display: "flex" }}>
        <Spinner />
      </span>
      Saving…
    </button>
  ),
};
