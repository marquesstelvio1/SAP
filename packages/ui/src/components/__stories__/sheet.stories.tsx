import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet";

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you are done.
          </SheetDescription>
        </SheetHeader>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            padding: "var(--space-4) 0",
          }}
        >
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" defaultValue="john@example.com" />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </SheetClose>
          <Button size="sm">Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Open Navigation</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse through the available sections.</SheetDescription>
        </SheetHeader>
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            padding: "var(--space-4) 0",
          }}
        >
          {["Dashboard", "Analytics", "Settings", "Help"].map((item) => (
            <Button key={item} variant="ghost" style={{ justifyContent: "flex-start" }}>
              {item}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  ),
};

export const Top: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Open Notification</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>You have 3 unread notifications.</SheetDescription>
        </SheetHeader>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            padding: "var(--space-4) 0",
          }}
        >
          {["New login detected", "Payment received", "Weekly report ready"].map((item) => (
            <div
              key={item}
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-md)",
                background: "var(--muted)",
                fontSize: "0.875rem",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetTrigger asChild>
        <Button variant="outline">Open Actions</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
          <SheetDescription>Select an action to perform.</SheetDescription>
        </SheetHeader>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            padding: "var(--space-4) 0",
          }}
        >
          {["Share", "Download", "Print", "Bookmark"].map((item) => (
            <Button key={item} variant="outline" style={{ justifyContent: "flex-start" }}>
              {item}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  ),
};
