"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import type { BlogPost } from "@/types/blog";
import { AdminMenuTable } from "./admin-menu-table";
import { AdminCategoriesPanel } from "./admin-categories-panel";
import { AdminBlogTable } from "./admin-blog-table";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
  items: MenuItem[];
  categories: string[];
  posts: BlogPost[];
}

const TABS = ["Menu", "Categories", "Blog"] as const;
type Tab = (typeof TABS)[number];

export function AdminTabs({ items, categories, posts }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Menu");

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-b-2 border-orange-500 text-orange-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Menu" && (
        <AdminMenuTable initialItems={items} categories={categories} />
      )}
      {activeTab === "Categories" && (
        <AdminCategoriesPanel initialCategories={categories} />
      )}
      {activeTab === "Blog" && <AdminBlogTable initialPosts={posts} />}
    </div>
  );
}
