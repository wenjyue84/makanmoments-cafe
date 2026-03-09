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
