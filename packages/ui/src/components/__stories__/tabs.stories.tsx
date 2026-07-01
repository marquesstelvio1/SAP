import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" style={{ width: 400 }}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Manage your account details and preferences.
        </p>
      </TabsContent>
      <TabsContent value="password">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Update your password and security settings.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Configure application preferences.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="overview" style={{ width: 450 }}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Dashboard overview with key metrics.
        </p>
      </TabsContent>
      <TabsContent value="analytics">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Detailed analytics and charts.
        </p>
      </TabsContent>
      <TabsContent value="reports">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Generate and view reports.
        </p>
      </TabsContent>
      <TabsContent value="notifications">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Manage your notification preferences.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const SingleTab: Story = {
  render: () => (
    <Tabs defaultValue="details" style={{ width: 300 }}>
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <p style={{ fontSize: "0.875rem", margin: 0, color: "var(--muted-foreground)" }}>
          Single tab content.
        </p>
      </TabsContent>
    </Tabs>
  ),
};
