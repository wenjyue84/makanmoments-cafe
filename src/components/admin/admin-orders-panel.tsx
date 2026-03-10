"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminOrders, type FilterTab } from "@/hooks/useAdminOrders";
import { AdminOrderCard } from "./admin-order-card";

const FILTER_TABS: FilterTab[] = ["All", "Pending", "Active", "Done", "Expired"];

export function AdminOrdersPanel() {
  const {
    orders,
    loading,
    refreshing,
    filterTab,
    setFilterTab,
    pendingCount,
    filtered,
    fetchOrders,
    approveOrder,
    rejectOrder,
    updateStatus,
  } = useAdminOrders();

  const expiredCount = orders.filter((o) => o.status === "expired").length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Pre-Orders</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {pendingCount} pending
            </span>
          )}
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={cn(
              "min-h-[40px] px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              filterTab === tab
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {tab}
            {tab === "Pending" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
            {tab === "Expired" && expiredCount > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-400 text-white text-[10px] font-bold px-1.5 py-0.5">
                {expiredCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No orders in this category.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              onApprove={approveOrder}
              onReject={rejectOrder}
              onStatusUpdate={updateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
