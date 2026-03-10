"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import { cn } from "@/lib/utils";

const LoadingPlaceholder = () => (
  <div className="p-8 text-center text-gray-400">Loading...</div>
);

const AdminMenuTable = dynamic(
  () => import("./admin-menu-table").then((m) => m.AdminMenuTable),
  { ssr: false, loading: LoadingPlaceholder }
);
const AdminCategoriesPanel = dynamic(
  () => import("./admin-categories-panel").then((m) => m.AdminCategoriesPanel),
  { ssr: false, loading: LoadingPlaceholder }
);
const AdminBlogTable = dynamic(
  () => import("./admin-blog-table").then((m) => m.AdminBlogTable),
  { ssr: false, loading: LoadingPlaceholder }
);
const AdminRulesPanel = dynamic(
  () => import("./admin-rules-panel").then((m) => m.AdminRulesPanel),
  { ssr: false, loading: LoadingPlaceholder }
);
const AdminTestsPanel = dynamic(
  () => import("./admin-tests-panel").then((m) => m.AdminTestsPanel),
  { ssr: false, loading: LoadingPlaceholder }
);
const AdminSettingsPanel = dynamic(
  () => import("./admin-settings-panel").then((m) => m.AdminSettingsPanel),
  { ssr: false, loading: LoadingPlaceholder }
);
const AdminOrdersPanel = dynamic(
  () => import("./admin-orders-panel").then((m) => m.AdminOrdersPanel),
  { ssr: false, loading: LoadingPlaceholder }
);

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

const TAB_SLUGS: Record<Tab, string> = {
  Orders: "orders",
  Menu: "menu",
  Categories: "categories",
  Rules: "rules",
  Blog: "blog",
  Tests: "tests",
  Settings: "settings",
};

const SLUG_TO_TAB: Record<string, Tab> = {
  orders: "Orders",
  menu: "Menu",
  categories: "Categories",
  rules: "Rules",
  blog: "Blog",
  tests: "Tests",
  settings: "Settings",
};

export function AdminTabs({ items, categories, posts }: AdminTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Derive active tab from URL segment
  const slug = pathname.split("/").pop() ?? "";
  const activeTab: Tab = SLUG_TO_TAB[slug] ?? "Menu";

  const handleTabClick = (tab: Tab) => {
    router.push(`/admin/${TAB_SLUGS[tab]}`);
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
