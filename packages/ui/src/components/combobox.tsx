"use client";

import { Command as CommandPrimitive } from "cmdk";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";

const comboboxDensityHeight = {
  comfortable: "h-[var(--density-comfortable-control-height)]",
  compact: "h-[var(--density-compact-control-height)]",
  operational: "h-[var(--density-operational-control-height)]",
} as const;

type ComboboxItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

function Combobox({
  items,
  value,
  onValueChange,
  searchPlaceholder = "Pesquisar...",
  emptyMessage = "Nenhum resultado encontrado.",
  notSelectedLabel = "Selecionar...",
  className,
  density = "compact",
  disabled = false,
  popoverWidth = "trigger",
}: {
  items: ComboboxItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  notSelectedLabel?: string;
  className?: string;
  density?: "comfortable" | "compact" | "operational";
  disabled?: boolean;
  popoverWidth?: "trigger" | "content";
}) {
  const [open, setOpen] = React.useState(false);

  const selectedItem = items.find((item) => item.value === value);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredItems = React.useMemo(
    () =>
      searchQuery
        ? items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : items,
    [items, searchQuery],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          data-slot="combobox-trigger"
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-panel outline-none transition-[color,box-shadow] duration-[var(--motion-duration-fast)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            comboboxDensityHeight[density],
            !selectedItem && "text-muted-foreground",
            className,
          )}
        >
          <span className="line-clamp-1">{selectedItem?.label ?? notSelectedLabel}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0",
          popoverWidth === "trigger" && "w-[var(--radix-popover-trigger-width)]",
        )}
        align="start"
        sideOffset={4}
      >
        <CommandPrimitive
          data-slot="combobox"
          shouldFilter={false}
          className="flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
        >
          <ComboboxInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandPrimitive.List
            data-slot="combobox-list"
            className="max-h-72 overflow-y-auto overflow-x-hidden"
          >
            {filteredItems.length === 0 && <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>}
            {filteredItems.map((item) => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                disabled={item.disabled ?? false}
                isSelected={item.value === value}
                onSelect={() => {
                  onValueChange?.(item.value);
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                {item.label}
              </ComboboxItem>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}

function ComboboxInput({
  className,
  placeholder = "Pesquisar...",
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="combobox-input-wrapper"
      className="flex items-center border-b px-3"
      cmdk-input-wrapper=""
    >
      <CommandPrimitive.Input
        data-slot="combobox-input"
        placeholder={placeholder}
        className={cn(
          "flex h-[var(--density-compact-control-height)] w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function ComboboxContent({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="combobox-content"
      className={cn("max-h-72 overflow-y-auto overflow-x-hidden p-1", className)}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  isSelected,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  isSelected?: boolean;
}) {
  return (
    <CommandPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="flex size-4 items-center justify-center">
        {isSelected && <CheckIcon className="size-4" />}
      </span>
      {children}
    </CommandPrimitive.Item>
  );
}

function ComboboxEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="combobox-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

export { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem };
