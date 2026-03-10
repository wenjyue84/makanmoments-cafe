"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

interface TrayOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface TrayOrder {
  id: number;
  items: TrayOrderItem[];
  total: string;
  status: string;
  created_at: string;
}

export function AdminOrdersBell() {
  const [orders, setOrders] = useState<TrayOrder[]>([]);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState<number | null>(null);
  const [muted, setMuted] = useState(false); // true when admin is viewing Orders tab
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return;
      const data: TrayOrder[] = await res.json();
      setOrders(data);
    } catch {
      // Silently fail — bell is non-critical UI
    }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Listen for admin:orders-viewed event — mute badge while Orders tab is active
  useEffect(() => {
    function handleOrdersViewed() { setMuted(true); }
    window.addEventListener("admin:orders-viewed", handleOrdersViewed);
    return () => window.removeEventListener("admin:orders-viewed", handleOrdersViewed);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "pending_approval"
  );
  const pendingCount = muted ? 0 : pendingOrders.length;

  async function markSeen(id: number) {
    setMarking(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "seen" }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: "seen" } : o))
        );
      }
    } catch {
      // Silently fail
    } finally {
      setMarking(null);
    }
  }

  function formatTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        aria-label="Order notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">
              Customer Orders{" "}
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  {pendingCount} pending
                </span>
              )}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No orders yet</p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className={`border-b px-4 py-3 last:border-0 transition-colors ${
                    order.status === "pending" ? "bg-orange-50" : "bg-white opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{formatTime(order.created_at)}</span>
                        {order.status === "pending" && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 uppercase tracking-wide">
                            New
                          </span>
                        )}
                      </div>
                      <ul className="text-sm text-gray-700 space-y-0.5">
                        {order.items.map((item, i) => (
                          <li key={i}>
                            {item.quantity}x {item.name}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 font-semibold text-sm text-gray-900">
                        Total: RM {Number(order.total).toFixed(2)}
                      </p>
                    </div>
                    {order.status === "pending" && (
                      <button
                        onClick={() => markSeen(order.id)}
                        disabled={marking === order.id}
                        className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {marking === order.id ? "..." : "Mark Seen"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
