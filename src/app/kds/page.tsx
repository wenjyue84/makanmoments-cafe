"use client";

import { useEffect, useState, useCallback } from "react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface KdsOrder {
  id: number;
  items: OrderItem[];
  total: string;
  status: string;
  contact_number: string | null;
  estimated_arrival: string | null;
  created_at: string;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-MY", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function elapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? "h-6 w-6"}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className ?? "h-6 w-6"}
    >
      <circle cx="12" cy="12" r="9.75" />
    </svg>
  );
}

interface OrderCardProps {
  order: KdsOrder;
  completedItems: Set<number>;
  onToggleItem: (itemIdx: number) => void;
  onMarkReady: () => void;
  isMarkingReady: boolean;
}

function OrderCard({
  order,
  completedItems,
  onToggleItem,
  onMarkReady,
  isMarkingReady,
}: OrderCardProps) {
  const [elapsed, setElapsed] = useState(elapsedMinutes(order.created_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(elapsedMinutes(order.created_at));
    }, 60000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const urgent = elapsed >= 20;
  const allDone =
    order.items.length > 0 &&
    order.items.every((_, i) => completedItems.has(i));

  let borderClass = "border-gray-700";
  let bgClass = "bg-gray-800";
  if (allDone) {
    borderClass = "border-green-500";
    bgClass = "bg-gray-800";
  } else if (urgent) {
    borderClass = "border-red-500";
    bgClass = "bg-red-950";
  }

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-lg ${borderClass} ${bgClass}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Order
          </p>
          <p className="text-4xl font-black text-white">#{order.id}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${urgent && !allDone ? "text-red-400" : "text-orange-400"}`}>
            {elapsed}m
          </p>
          <p className="text-xs text-gray-400">elapsed</p>
        </div>
      </div>

      {/* ETA */}
      <div className="mb-5 rounded-xl bg-gray-900/60 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Customer ETA
        </p>
        <p className="mt-0.5 text-xl font-bold text-white">
          {formatTime(order.estimated_arrival)}
          <span className="ml-2 text-base font-normal text-gray-400">
            {formatDate(order.estimated_arrival)}
          </span>
        </p>
      </div>

      {/* Items — tap to complete */}
      <ul className="space-y-1">
        {order.items.map((item, i) => {
          const done = completedItems.has(i);
          return (
            <li key={i}>
              <button
                onClick={() => onToggleItem(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  done
                    ? "text-gray-400 hover:bg-gray-700/40"
                    : "text-white hover:bg-gray-700/60"
                }`}
              >
                {done ? (
                  <CheckCircleIcon className="h-6 w-6 shrink-0 text-green-400" />
                ) : (
                  <CircleIcon className="h-6 w-6 shrink-0 text-gray-500" />
                )}
                <span
                  className={`flex-1 text-lg font-semibold ${done ? "line-through" : ""}`}
                >
                  {item.name}
                </span>
                <span
                  className={`shrink-0 rounded-lg px-3 py-1 text-lg font-black ${
                    done ? "bg-gray-600 text-gray-400" : "bg-orange-500 text-white"
                  }`}
                >
                  ×{item.quantity}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-700 pt-4">
        <p className="text-sm text-gray-400">
          {order.contact_number ?? "No contact"}
        </p>
        <p className="text-xl font-bold text-white">
          RM {parseFloat(order.total).toFixed(2)}
        </p>
      </div>

      {/* Mark as Ready button — appears only when all items done */}
      {allDone && (
        <button
          onClick={onMarkReady}
          disabled={isMarkingReady}
          className="mt-4 w-full rounded-xl bg-green-500 py-3 text-lg font-bold text-white transition-colors hover:bg-green-400 disabled:opacity-60"
        >
          {isMarkingReady ? "Marking Ready…" : "✅ Mark as Ready"}
        </button>
      )}
    </div>
  );
}

export default function KdsPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  // Map<orderId, Set<itemIndex>> — in-memory only
  const [completedItems, setCompletedItems] = useState<Map<number, Set<number>>>(new Map());
  const [markingReady, setMarkingReady] = useState<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kds/orders");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/kds/login";
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { orders: KdsOrder[] };
      setOrders(data.orders);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    const interval = setInterval(() => void fetchOrders(), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const toggleItem = useCallback((orderId: number, itemIdx: number) => {
    setCompletedItems((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(orderId) ?? []);
      if (set.has(itemIdx)) {
        set.delete(itemIdx);
      } else {
        set.add(itemIdx);
      }
      next.set(orderId, set);
      return next;
    });
  }, []);

  const markReady = useCallback(
    async (orderId: number) => {
      setMarkingReady((prev) => new Set(prev).add(orderId));
      try {
        const res = await fetch(`/api/kds/orders/${orderId}/ready`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        // Optimistic removal from list
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setCompletedItems((prev) => {
          const next = new Map(prev);
          next.delete(orderId);
          return next;
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to mark order ready");
      } finally {
        setMarkingReady((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Kitchen Display</h1>
          <p className="text-sm text-gray-400">
            Orders in preparation — auto-refreshes every 30s
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-400">{orders.length}</p>
          <p className="text-xs text-gray-400">preparing</p>
          <p className="mt-1 text-xs text-gray-500">
            Updated{" "}
            {lastRefresh.toLocaleTimeString("en-MY", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <p className="text-2xl text-gray-400">Loading orders…</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-700 bg-red-950 p-6 text-center">
          <p className="text-xl text-red-300">{error}</p>
          <button
            onClick={() => void fetchOrders()}
            className="mt-4 rounded-lg bg-red-700 px-6 py-3 text-white hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <p className="text-6xl">✅</p>
          <p className="text-2xl font-bold text-gray-300">All clear!</p>
          <p className="text-gray-500">No orders currently being prepared.</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              completedItems={completedItems.get(order.id) ?? new Set()}
              onToggleItem={(idx) => toggleItem(order.id, idx)}
              onMarkReady={() => void markReady(order.id)}
              isMarkingReady={markingReady.has(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
