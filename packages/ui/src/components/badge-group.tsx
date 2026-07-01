import type { VariantProps } from "class-variance-authority";
import { Badge, type badgeVariants } from "./badge.js";

export type BadgeGroupProps = {
  items: {
    label: string;
    variant?: VariantProps<typeof badgeVariants>["variant"];
  }[];
};

export function BadgeGroup({ items }: BadgeGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item.label} variant={item.variant}>
          {item.label}
        </Badge>
      ))}
    </div>
  );
}
