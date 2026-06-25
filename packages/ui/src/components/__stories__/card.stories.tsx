import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: 350 }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: "0.875rem", margin: 0 }}>This is the card content area.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card style={{ width: 350 }}>
      <CardHeader>
        <CardTitle>Confirm Action</CardTitle>
        <CardDescription>Are you sure you want to proceed?</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: "0.875rem", margin: 0 }}>This action cannot be undone.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button variant="destructive" size="sm">
          Confirm
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const MetricTile: Story = {
  parameters: {
    layout: "centered",
  },
  render: () => (
    <Card style={{ width: 220 }}>
      <CardHeader>
        <CardDescription>Total Revenue</CardDescription>
        <CardTitle style={{ fontSize: "1.75rem" }}>$45,231</CardTitle>
      </CardHeader>
      <CardContent style={{ paddingTop: 0 }}>
        <span style={{ color: "var(--success)", fontSize: "0.875rem" }}>+20.1%</span>
        <span
          style={{
            color: "var(--muted-foreground)",
            fontSize: "0.875rem",
            marginLeft: "var(--space-1)",
          }}
        >
          from last month
        </span>
      </CardContent>
    </Card>
  ),
};
