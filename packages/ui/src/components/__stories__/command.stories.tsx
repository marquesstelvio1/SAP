import type { Meta, StoryObj } from "@storybook/react";
import { CalculatorIcon, CalendarIcon, CreditCardIcon, SettingsIcon, UserIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../command";

const meta = {
  title: "Components/Command",
  component: Command,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command style={{ width: 320 }}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <CalendarIcon />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <UserIcon />
            <span>Profile</span>
          </CommandItem>
          <CommandItem>
            <CreditCardIcon />
            <span>Billing</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <UserIcon />
            <span>Team</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CalculatorIcon />
            <span>Calculator</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Empty: Story = {
  render: () => (
    <Command style={{ width: 320 }}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </Command>
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <Command style={{ width: 320 }}>
      <CommandInput placeholder="Search…" />
      <CommandList>
        <CommandGroup heading="Actions">
          <CommandItem>New File</CommandItem>
          <CommandItem>Copy Path</CommandItem>
          <CommandItem disabled>Delete (unavailable)</CommandItem>
          <CommandItem>Duplicate</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
