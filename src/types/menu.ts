export interface MenuItem {
  id: string;            // UUID
  code: string;
  nameEn: string;
  nameMs: string;
  nameZh: string;
  price: number;
  description: string;
  dietary: string[];
  categories: string[];  // multi-category array (was `category: string`)
  available: boolean;
  featured: boolean;
  photo: string | null;  // derived: /images/menu/{code}.jpg
  sortOrder: number;
  availableDays: string[];
  timeFrom: string;
  timeUntil: string;
  specialDates: string[];
}

export interface MenuFilters {
  category: string | null;
  search: string;
  dietaryOnly: boolean;
}

// ── Rules (bulk operations) ─────────────────────────────────────────────────

export type RuleType = "disable" | "discount" | "featured";
export type TargetType = "category" | "items";

export interface Rule {
  id: string;
  name: string;
  ruleType: RuleType;
  targetType: TargetType;
  targetCategories: string[];
  targetItemIds: string[];
  excludeItemIds: string[];
  value: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  timeFrom: string;       // daily recurring start "HH:MM" (empty = no constraint)
  timeUntil: string;      // daily recurring end "HH:MM" (empty = no constraint)
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  ruleType: RuleType;
  value?: number;
}

export interface MenuItemWithRules extends MenuItem {
  originalPrice?: number;
  discountPercent?: number;
  featuredByRule?: boolean;
  disabledByRule?: boolean;
  appliedRules?: AppliedRule[];
}
