"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, ShoppingBag, ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminFloatingToolbarProps {
  locale: string;
}

export function AdminFloatingToolbar({ locale }: AdminFloatingToolbarProps) {
  const [expanded, setExpanded] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const pathname = usePathname();

  // Fetch pending orders count on mount
  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const pending = (data as { status: string }[]).filter(
            (o) => o.status === "pending_approval"
          ).length;
          setPendingCount(pending);
        }
      })
      .catch(() => {});
  }, []);

  // Don't show toolbar on the /admin routes (already in admin panel)
  if (pathname?.startsWith("/admin")) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 md:bottom-6 md:right-6"
        aria-label="Open admin toolbar"
      >
        <Settings className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      <div className="flex items-center gap-1 rounded-2xl border border-amber-300 bg-amber-50/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm dark:border-amber-600/40 dark:bg-amber-950/90">
        {/* Admin label */}
        <span className="mr-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
          Admin
        </span>
        <div className="h-4 w-px bg-amber-200 dark:bg-amber-700" />

        {/* Menu page shortcut */}
        <Link
          href={`/${locale}/menu`}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40",
            pathname?.includes("/menu") && "bg-amber-100 dark:bg-amber-900/30"
          )}
          title="Menu page (edit mode)"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Menu</span>
        </Link>

        {/* Orders */}
        <Link
          href="/admin/orders"
          className="relative flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          title="Manage orders"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Orders</span>
          {pendingCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* Admin panel */}
        <Link
          href="/admin"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          title="Admin panel"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </Link>

        {/* Collapse */}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="ml-0.5 rounded-lg p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
          aria-label="Collapse toolbar"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
