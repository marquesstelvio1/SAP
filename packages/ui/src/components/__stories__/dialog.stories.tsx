import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you are done.
          </DialogDescription>
        </DialogHeader>
        <div style={{ fontSize: "0.875rem", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, color: "var(--muted-foreground)" }}>Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ConfirmDelete: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Important Notice</DialogTitle>
          <DialogDescription>Please read before continuing.</DialogDescription>
        </DialogHeader>
        <div style={{ fontSize: "0.875rem", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
            This dialog requires explicit action — no close button is available.
          </p>
        </div>
        <DialogFooter>
          <Button size="sm">I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
