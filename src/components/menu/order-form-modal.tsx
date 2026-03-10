"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderFormModalProps {
  items: OrderItem[];
  total: number;
  onSuccess: (orderId: number) => void;
  onClose: () => void;
}

const MALAYSIA_PHONE_RE = /^(\+?60|0)1[0-9]{8,9}$/;

function getMinArrivalTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function OrderFormModal({ items, total, onSuccess, onClose }: OrderFormModalProps) {
  const t = useTranslations("orderForm");
  const [step, setStep] = useState<1 | 2>(1);
  const [contactNumber, setContactNumber] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [contactError, setContactError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const minTime = useMemo(() => getMinArrivalTime(), []);

  function validateContact(value: string): boolean {
    const normalized = value.replace(/[\s-]/g, "");
    if (!normalized) {
      setContactError(t("contactRequired"));
      return false;
    }
    if (!MALAYSIA_PHONE_RE.test(normalized)) {
      setContactError(t("contactInvalid"));
      return false;
    }
    setContactError("");
    return true;
  }

  function validateTime(value: string): boolean {
    if (!value) {
      setTimeError(t("arrivalRequired"));
      return false;
    }
    const [h, m] = value.split(":").map(Number);
    const now = new Date();
    const selected = new Date();
    selected.setHours(h, m, 0, 0);
    // Handle day-wrap: if selected is far in the past it's next day
    if (selected.getTime() < now.getTime() - 12 * 60 * 60 * 1000) {
      selected.setDate(selected.getDate() + 1);
    }
    if (selected.getTime() - now.getTime() < 14 * 60 * 1000) {
      setTimeError(t("arrivalTooSoon"));
      return false;
    }
    setTimeError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const contactOk = validateContact(contactNumber);
    const timeOk = validateTime(arrivalTime);
    if (!contactOk || !timeOk) return;

    // Build estimated arrival as ISO timestamp (today + selected time, with day-wrap)
    const [h, m] = arrivalTime.split(":").map(Number);
    const now = new Date();
    const arrivalDate = new Date();
    arrivalDate.setHours(h, m, 0, 0);
    if (arrivalDate.getTime() < now.getTime() - 12 * 60 * 60 * 1000) {
      arrivalDate.setDate(arrivalDate.getDate() + 1);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
          contactNumber: contactNumber.replace(/[\s-]/g, ""),
          estimatedArrival: arrivalDate.toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = (await res.json()) as { ok: boolean; id: number };
      setOrderId(data.id);
      onSuccess(data.id);
      setStep(2);
    } catch {
      setTimeError(t("submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
        onClick={step === 1 ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 z-[61] -translate-y-1/2 rounded-2xl bg-background shadow-2xl max-w-sm mx-auto">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold">
            {step === 1 ? t("title") : t("titleConfirm")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Contact number */}
            <div className="space-y-1">
              <label htmlFor="ofm-contact" className="block text-sm font-semibold">
                {t("contactLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                id="ofm-contact"
                type="tel"
                placeholder={t("contactPlaceholder")}
                value={contactNumber}
                onChange={(e) => {
                  setContactNumber(e.target.value);
                  if (contactError) validateContact(e.target.value);
                }}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {contactError && <p className="text-xs text-red-500">{contactError}</p>}
            </div>

            {/* Arrival time */}
            <div className="space-y-1">
              <label htmlFor="ofm-arrival" className="block text-sm font-semibold">
                {t("arrivalLabel")} <span className="text-red-500">*</span>
              </label>
              <input
                id="ofm-arrival"
                type="time"
                min={minTime}
                value={arrivalTime}
                onChange={(e) => {
                  setArrivalTime(e.target.value);
                  if (timeError) validateTime(e.target.value);
                }}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">{t("arrivalMin")}</p>
              {timeError && <p className="text-xs text-red-500">{timeError}</p>}
            </div>

            {/* Order summary */}
            <div className="rounded-xl bg-muted/40 p-3 space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t border-border/40">
                <span>Total</span>
                <span>RM {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary py-4 text-primary-foreground font-bold text-base hover:bg-primary/90 disabled:opacity-70 transition-colors active:scale-[0.98]"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
          </form>
        ) : (
          <div className="p-5 space-y-5 text-center">
            <div className="text-5xl">🎉</div>
            <div>
              <p className="font-bold text-xl">
                {t("orderNumber", { id: orderId ?? "" })}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("awaitingConfirmation")}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 text-sm text-amber-800 dark:text-amber-200 text-left">
              <p className="font-semibold">{t("whatNext")}</p>
              <p className="mt-1">{t("whatNextDesc")}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-full bg-primary py-4 text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              {t("done")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
