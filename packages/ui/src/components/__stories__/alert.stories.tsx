import type { Meta, StoryObj } from "@storybook/react";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    className: { control: "text" },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>This is a default alert with some information.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert>
      <AlertTriangleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
    </Alert>
  ),
};

export const Info: Story = {
  render: () => (
    <Alert>
      <InfoIcon />
      <AlertTitle>Information</AlertTitle>
      <AlertDescription>A new update is available. Restart to apply changes.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert>
      <CheckCircleIcon />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Your changes have been saved successfully.</AlertDescription>
    </Alert>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Alert>
      <InfoIcon />
      <AlertTitle>Terms of Service Update</AlertTitle>
      <AlertDescription>
        We have updated our terms of service effective March 15, 2026. The key changes include
        updated data processing descriptions, clarified content ownership terms, and new dispute
        resolution procedures. Please review the full document for details.
      </AlertDescription>
    </Alert>
  ),
};
