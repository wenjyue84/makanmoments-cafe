"use client";

import { useState } from "react";
import {
  UtensilsCrossed,
  Tag,
  Shield,
  BookOpen,
  FlaskConical,
  ShoppingBag,
  Settings,
  Menu,
  X,
} from "lucide-react";
import type { MenuItemWithRules } from "@/types/menu";
import type { BlogPost } from "@/types/blog";
import { AdminMenuTable } from "./admin-menu-table";
import { AdminCategoriesPanel } from "./admin-categories-panel";
import { AdminBlogTable } from "./admin-blog-table";
import { AdminRulesPanel } from "./admin-rules-panel";
import { AdminTestsPanel } from "./admin-tests-panel";
import { AdminSettingsPanel } from "./admin-settings-panel";
import { AdminOrdersPanel } from "./admin-orders-panel";
import { cn } from "@/lib/utils";

interface AdminTabsProps {
  items: MenuItemWithRules[];
  categories: string[];
  posts: BlogPost[];
}

const TABS = [
  "Orders",
  "Menu",
  "Categories",
  "Rules",
  "Blog",
  "Tests",
  "Settings",
] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  Orders: <ShoppingBag className="h-4 w-4 shrink-0" />,
  Menu: <UtensilsCrossed className="h-4 w-4 shrink-0" />,
  Categories: <Tag className="h-4 w-4 shrink-0" />,
  Rules: <Shield className="h-4 w-4 shrink-0" />,
  Blog: <BookOpen className="h-4 w-4 shrink-0" />,
  Tests: <FlaskConical className="h-4 w-4 shrink-0" />,
  Settings: <Settings className="h-4 w-4 shrink-0" />,
};

export function AdminTabs({ items, categories, posts }: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Menu");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-52 shrink-0 border-r bg-white transition-transform lg:static lg:translate-x-0 lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between border-b px-4 py-3 lg:hidden">
            <span className="text-sm font-semibold text-gray-700">Navigation</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                  activeTab === tab
                    ? "border-l-2 border-orange-500 bg-orange-50 text-orange-600"
                    : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {TAB_ICONS[tab]}
                <span>{tab}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile hamburger header */}
        <div className="flex items-center gap-3 border-b bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">{activeTab}</span>
        </div>

        {/* Content area */}
        <main className="flex-1 p-6">
          {activeTab === "Orders" && <AdminOrdersPanel />}
          {activeTab === "Menu" && (
            <AdminMenuTable initialItems={items} categories={categories} />
          )}
          {activeTab === "Categories" && (
            <AdminCategoriesPanel initialCategories={categories} allItems={items} />
          )}
          {activeTab === "Rules" && <AdminRulesPanel categories={categories} />}
          {activeTab === "Blog" && <AdminBlogTable initialPosts={posts} />}
          {activeTab === "Tests" && <AdminTestsPanel />}
          {activeTab === "Settings" && <AdminSettingsPanel categories={categories} />}
        </main>
      </div>
    </div>
  );
}
