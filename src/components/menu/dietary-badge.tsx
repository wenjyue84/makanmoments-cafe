import { cn } from "@/lib/utils";

const BADGE_CLASSES: Record<string, string> = {
  Spicy: "badge-spicy",
  Vegetarian: "badge-vegetarian",
  Vegan: "badge-vegan",
  "Gluten Free": "badge-gluten-free",
};

interface DietaryBadgeProps {
  label: string;
}

export function DietaryBadge({ label }: DietaryBadgeProps) {
  return (
    <span
      role="img"
      aria-label={`Dietary: ${label}`}
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        BADGE_CLASSES[label] || "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
