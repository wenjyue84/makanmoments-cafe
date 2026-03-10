"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, Clock, XCircle, PhoneCall } from "lucide-react";
import Link from "next/link";
// Phone formatted for wa.me (strip non-digits, ensure 60 prefix)
function phoneToWaMe(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("60") ? digits : `60${digits.replace(/^0/, "")}`;
}

// Status step ordering — rejected is a terminal side-state, not in the linear flow
const STATUS_STEPS = [
  "pending_approval",
  "approved",
  "payment_pending",
  "payment_uploaded",
  "preparing",
  "ready",
] as const;

type OrderStatus =
  | "pending_approval"
  | "approved"
  | "payment_pending"
  | "payment_uploaded"
  | "preparing"
  | "ready"
  | "rejected"
  | "cancelled";

interface OrderData {
  id: number;
  status: OrderStatus;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  contactNumber: string | null;
  estimatedArrival: string | null;
  estimatedReady: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StepBar({
  currentStatus,
  t,
}: {
  currentStatus: OrderStatus;
  t: ReturnType<typeof useTranslations>;
}) {
  const isRejected =
    currentStatus === "rejected" || currentStatus === "cancelled";
  const currentIndex = isRejected
    ? -1
    : STATUS_STEPS.indexOf(currentStatus as (typeof STATUS_STEPS)[number]);

  return (
    <div className="w-full overflow-x-auto">
      <ol className="flex min-w-max items-start gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = !isRejected && idx < currentIndex;
          const isCurrent = !isRejected && idx === currentIndex;
          const isPending = isRejected || idx > currentIndex;

          return (
            <li key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-amber-600 bg-amber-600 text-white"
                      : isCurrent
                        ? "border-amber-600 bg-white text-amber-600"
                        : "border-stone-300 bg-white text-stone-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <div className="h-3 w-3 animate-pulse rounded-full bg-amber-600" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`max-w-[70px] text-center text-[10px] leading-tight ${
                    isCurrent
                      ? "font-semibold text-amber-700"
                      : isCompleted
                        ? "text-amber-600"
                        : "text-stone-400"
                  } ${isPending && !isCurrent ? "opacity-60" : ""}`}
                >
                  {t(`step_${step}`)}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-10 flex-shrink-0 transition-colors ${
                    isCompleted ? "bg-amber-600" : "bg-stone-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.id as string;
  const t = useTranslations("orderStatus");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (res.status === 404) {
        setError(t("notFound"));
        return;
      }
      if (!res.ok) {
        setError(t("fetchError"));
        return;
      }
      const data = (await res.json()) as OrderData;
      setOrder(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    void fetchOrder();
    const interval = setInterval(() => void fetchOrder(), 15_000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-500">
          <Clock className="h-10 w-10 animate-spin" />
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <p className="font-semibold text-red-700">
            {error ?? t("fetchError")}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-amber-700 underline"
          >
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const isRejected =
    order.status === "rejected" || order.status === "cancelled";
  const isReady = order.status === "ready";

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-stone-500">{t("orderNumber", { id: order.id })}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-stone-800">
          {isRejected
            ? t("titleRejected")
            : isReady
              ? t("titleReady")
              : t("title")}
        </h1>
        {lastUpdated && (
          <p className="mt-1 text-xs text-stone-400">
            {t("lastUpdated", { time: lastUpdated.toLocaleTimeString("en-MY", { timeStyle: "short" }) })}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {!isRejected && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <StepBar currentStatus={order.status} t={t} />
        </div>
      )}

      {/* Rejected / Cancelled state */}
      {isRejected && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">{t("rejectedTitle")}</p>
              {order.rejectionReason && (
                <p className="mt-1 text-sm text-red-600">{order.rejectionReason}</p>
              )}
              <Link
                href={`https://wa.me/${phoneToWaMe("012-708 8789")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                <PhoneCall className="h-4 w-4" />
                {t("contactUs")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stage-specific info cards */}
      {order.status === "approved" && order.estimatedReady && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
            {t("estimatedReady")}
          </p>
          <p className="mt-1 text-lg font-semibold text-amber-800">
            {formatDateTime(order.estimatedReady)}
          </p>
        </div>
      )}

      {order.status === "payment_pending" && (
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">{t("paymentTitle")}</p>
          <p className="mt-1 text-sm text-blue-700">{t("paymentDesc")}</p>
          <Link
            href={`/${params.locale as string}/order/${orderId}/payment`}
            className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            {t("paymentCta")}
          </Link>
        </div>
      )}

      {order.status === "preparing" && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            {t("preparingMsg")}
          </p>
          {order.estimatedReady && (
            <p className="mt-1 text-sm text-green-700">
              {t("readyAt", { time: formatDateTime(order.estimatedReady) })}
            </p>
          )}
        </div>
      )}

      {isReady && (
        <div className="mb-4 rounded-2xl border border-green-300 bg-green-100 p-4 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-1 font-semibold text-green-800">{t("readyMsg")}</p>
          <p className="mt-0.5 text-sm text-green-700">{t("readySubMsg")}</p>
        </div>
      )}

      {/* Order summary */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
          {t("orderSummary")}
        </h2>
        <ul className="space-y-2">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between text-sm">
              <span className="text-stone-700">
                {item.name}
                <span className="ml-1 text-stone-400">×{item.quantity}</span>
              </span>
              <span className="font-medium text-stone-800">
                RM {(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
          <span className="font-semibold text-stone-700">{t("total")}</span>
          <span className="font-bold text-amber-700">RM {Number(order.total).toFixed(2)}</span>
        </div>

        {order.estimatedArrival && (
          <p className="mt-3 text-xs text-stone-400">
            {t("arrival")}: {formatDateTime(order.estimatedArrival)}
          </p>
        )}
      </div>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-amber-700 underline">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
