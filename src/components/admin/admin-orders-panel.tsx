"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X, Clock, RefreshCw, Eye } from "lucide-react";
import { cn, fetchWithTimeout } from "@/lib/utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AdminOrder {
  id: number;
  items: OrderItem[];
  total: string;
  status: string;
  contact_number: string | null;
  estimated_arrival: string | null;
  estimated_ready: string | null;
  rejection_reason: string | null;
  payment_screenshot_url: string | null;
  created_at: string;
}

type FilterTab = "All" | "Pending" | "Active" | "Done" | "Expired";

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  payment_pending: "Awaiting Payment",
  payment_uploaded: "Payment Uploaded",
  preparing: "Preparing",
  ready: "Ready",
  expired: "Expired",
  seen: "Seen",
  pending: "Pending",
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  payment_pending: "bg-orange-100 text-orange-800",
  payment_uploaded: "bg-violet-100 text-violet-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-purple-100 text-purple-800",
  expired: "bg-stone-100 text-stone-600",
  seen: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-800",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

// Compute default estimated-ready time = now + 30 min, rounded to nearest 5
function defaultReadyTime() {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

function filterOrders(orders: AdminOrder[], tab: FilterTab) {
  if (tab === "Pending") return orders.filter((o) => o.status === "pending_approval" || o.status === "pending");
  if (tab === "Active") return orders.filter((o) => ["approved", "payment_pending", "payment_uploaded", "preparing"].includes(o.status));
  if (tab === "Done") return orders.filter((o) => o.status === "ready" || o.status === "rejected" || o.status === "seen");
  if (tab === "Expired") return orders.filter((o) => o.status === "expired");
  return orders;
}

// ---------------------------------------------------------------------------
// Approve modal
// ---------------------------------------------------------------------------
interface ApproveModalProps {
  orderId: number;
  onClose: () => void;
  onDone: (updated: Partial<AdminOrder>) => void;
}

function ApproveModal({ orderId, onClose, onDone }: ApproveModalProps) {
  const [readyTime, setReadyTime] = useState(defaultReadyTime());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!readyTime) { setErr("Please select an estimated ready time."); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await fetchWithTimeout(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", estimatedReady: new Date(readyTime).toISOString() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error ?? "Failed to approve");
        return;
      }
      const data = await res.json();
      onDone({ status: "approved", estimated_ready: data.estimated_ready });
    } catch (err) {
      setErr(err instanceof Error && err.name === "AbortError" ? "Request timed out — please try again" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Approve Order #{orderId}</h3>
        <p className="text-sm text-gray-500 mb-4">Set the estimated food-ready time.</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ready by</label>
        <input
          type="datetime-local"
          value={readyTime}
          onChange={(e) => setReadyTime(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 min-h-[40px] rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving…" : "Confirm Approval"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="min-h-[40px] rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject modal
// ---------------------------------------------------------------------------
interface RejectModalProps {
  orderId: number;
  onClose: () => void;
  onDone: (updated: Partial<AdminOrder>) => void;
}

function RejectModal({ orderId, onClose, onDone }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  async function submit() {
    if (!reason.trim()) { setErr("Please enter a rejection reason."); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await fetchWithTimeout(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: reason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error ?? "Failed to reject");
        return;
      }
      onDone({ status: "rejected", rejection_reason: reason.trim() });
    } catch (err) {
      setErr(err instanceof Error && err.name === "AbortError" ? "Request timed out — please try again" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Reject Order #{orderId}</h3>
        <p className="text-sm text-gray-500 mb-4">Tell the customer why we cannot fulfil this order.</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <textarea
          ref={textRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Fully booked for the requested time"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 min-h-[40px] rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="h-4 w-4" />
            {saving ? "Saving…" : "Confirm Rejection"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="min-h-[40px] rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment view modal
// ---------------------------------------------------------------------------
interface PaymentModalProps {
  orderId: number;
  screenshotUrl: string;
  onClose: () => void;
  onDone: (updated: Partial<AdminOrder>) => void;
}

function PaymentModal({ orderId, screenshotUrl, onClose, onDone }: PaymentModalProps) {
  const [saving, setSaving] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  async function confirmPayment() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetchWithTimeout(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_payment" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error ?? "Failed to confirm payment");
        return;
      }
      onDone({ status: "preparing" });
    } catch (err) {
      setErr(err instanceof Error && err.name === "AbortError" ? "Request timed out — please try again" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function rejectPayment() {
    if (!reason.trim()) { setErr("Please enter a reason."); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await fetchWithTimeout(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_payment", rejectionReason: reason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.error ?? "Failed to reject payment");
        return;
      }
      onDone({ status: "payment_pending", rejection_reason: reason.trim() });
    } catch (err) {
      setErr(err instanceof Error && err.name === "AbortError" ? "Request timed out — please try again" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Payment Screenshot</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <img
          src={screenshotUrl}
          alt="Payment screenshot"
          className="w-full rounded-lg border border-gray-200 object-contain max-h-64"
        />

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

        {!rejectMode ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void confirmPayment()}
              disabled={saving}
              className="flex-1 min-h-[40px] rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              {saving ? "Saving…" : "Confirm Payment ✓"}
            </button>
            <button
              onClick={() => setRejectMode(true)}
              disabled={saving}
              className="min-h-[40px] rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 px-3 disabled:opacity-50 transition-colors"
            >
              Reject ✗
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Screenshot unclear, wrong amount"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => void rejectPayment()}
                disabled={saving}
                className="flex-1 min-h-[40px] rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="h-4 w-4" />
                {saving ? "Saving…" : "Confirm Rejection"}
              </button>
              <button
                onClick={() => { setRejectMode(false); setErr(""); }}
                disabled={saving}
                className="min-h-[40px] rounded-lg border border-gray-300 px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order card
// ---------------------------------------------------------------------------
interface OrderCardProps {
  order: AdminOrder;
  onUpdate: (id: number, changes: Partial<AdminOrder>) => void;
}

function OrderCard({ order, onUpdate }: OrderCardProps) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  const isPending = order.status === "pending_approval" || order.status === "pending";
  const hasPaymentUploaded = order.status === "payment_uploaded";
  const isPreparing = order.status === "preparing";

  async function handleMarkReady() {
    setMarkingReady(true);
    try {
      const res = await fetchWithTimeout(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_ready" }),
      });
      if (!res.ok) return;
      onUpdate(order.id, { status: "ready" });
    } catch {
      // non-critical
    } finally {
      setMarkingReady(false);
    }
  }

  return (
    <>
      <div className={cn(
        "rounded-xl border bg-white shadow-sm p-4 flex flex-col gap-3",
        isPending && "border-yellow-300 bg-yellow-50/40"
      )}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-gray-400">#{order.id}</span>
            <span className={cn(
              "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
            )}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formatDateTime(order.created_at)}</span>
        </div>

        {/* Customer info */}
        <div className="text-sm text-gray-700 space-y-0.5">
          {order.contact_number && (
            <p><span className="text-gray-500">Phone:</span> {order.contact_number}</p>
          )}
          {order.estimated_arrival && (
            <p className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500">ETA:</span> {formatDateTime(order.estimated_arrival)}
            </p>
          )}
          {order.estimated_ready && (
            <p><span className="text-gray-500">Ready by:</span> {formatTime(order.estimated_ready)}</p>
          )}
          {order.rejection_reason && (
            <p className="text-red-600 text-xs mt-1">Rejected: {order.rejection_reason}</p>
          )}
        </div>

        {/* Items */}
        <ul className="text-sm text-gray-800 space-y-0.5 border-t pt-2">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between">
              <span>{item.quantity}× {item.name}</span>
              <span className="text-gray-500">RM {(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        {/* Total */}
        <div className="flex justify-between font-semibold text-sm border-t pt-2">
          <span>Total</span>
          <span>RM {Number(order.total).toFixed(2)}</span>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowApprove(true)}
              className="flex-1 min-h-[40px] rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 min-h-[40px] rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        )}

        {hasPaymentUploaded && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowPayment(true)}
              className="flex-1 min-h-[40px] rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="h-4 w-4" /> View Payment
            </button>
          </div>
        )}

        {isPreparing && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void handleMarkReady()}
              disabled={markingReady}
              className="flex-1 min-h-[40px] rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              {markingReady ? "Saving…" : "Mark Ready 🎉"}
            </button>
          </div>
        )}
      </div>

      {showApprove && (
        <ApproveModal
          orderId={order.id}
          onClose={() => setShowApprove(false)}
          onDone={(changes) => { onUpdate(order.id, changes); setShowApprove(false); }}
        />
      )}
      {showReject && (
        <RejectModal
          orderId={order.id}
          onClose={() => setShowReject(false)}
          onDone={(changes) => { onUpdate(order.id, changes); setShowReject(false); }}
        />
      )}
      {showPayment && order.payment_screenshot_url && (
        <PaymentModal
          orderId={order.id}
          screenshotUrl={order.payment_screenshot_url}
          onClose={() => setShowPayment(false)}
          onDone={(changes) => { onUpdate(order.id, changes); setShowPayment(false); }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("Pending");
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetchWithTimeout("/api/admin/orders");
      if (!res.ok) return;
      const data: AdminOrder[] = await res.json();
      setOrders(data);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Signal bell to clear badge (custom event — bell listens for this)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("admin:orders-viewed"));
  }, []);

  function handleUpdate(id: number, changes: Partial<AdminOrder>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...changes } : o)));
  }

  const pendingCount = orders.filter(
    (o) => o.status === "pending_approval" || o.status === "pending"
  ).length;

  const filtered = filterOrders(orders, filterTab);

  const FILTER_TABS: FilterTab[] = ["All", "Pending", "Active", "Done", "Expired"];

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
            <OrderCard key={order.id} order={order} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
