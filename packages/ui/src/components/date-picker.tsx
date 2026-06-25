"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Button } from "./button.js";
import { Calendar } from "./calendar.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-slot="date-picker"
          variant="outline"
          className={cn(
            "w-72 justify-start gap-2 text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="size-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange ?? (() => {})}
          required={false}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, type DatePickerProps };
