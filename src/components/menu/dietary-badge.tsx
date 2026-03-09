import { cn } from "@/lib/utils";

const BADGE_COLORS: Record<string, string> = {
  Spicy: "bg-red-100 text-red-700",
  Vegetarian: "bg-green-100 text-green-700",
  Vegan: "bg-emerald-100 text-emerald-700",
  "Gluten Free": "bg-amber-100 text-amber-700",
};

interface DietaryBadgeProps {
  label: string;
}

export function DietaryBadge({ label }: DietaryBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        BADGE_COLORS[label] || "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </span>
  );
}
