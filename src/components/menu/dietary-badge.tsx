import { Leaf } from "lucide-react";
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
  const isVegetarian = label.toLowerCase() === "vegetarian";
  return (
    <span
      role="img"
      aria-label={`Dietary: ${label}`}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-normal",
        BADGE_CLASSES[label] || "bg-muted text-muted-foreground"
      )}
    >
      {isVegetarian && <Leaf className="h-3 w-3" aria-hidden="true" />}
      {label}
    </span>
  );
}
