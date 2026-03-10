"use client";

import { useState } from "react";
import { ShoppingCart, X, Minus, Plus } from "lucide-react";
import { useTray } from "@/lib/tray-context";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function TrayWidget() {
    const [open, setOpen] = useState(false);
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { items, addItem, removeItem, clearTray, totalPrice } = useTray();
    const t = useTranslations("tray");

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const hasTomYum = items.some(i => i.name.toLowerCase().includes('tom yum'));
    const hasOmelette = items.some(i => i.name.toLowerCase().includes('omelette'));
    const showPairingBanner = hasTomYum && !hasOmelette && !checkoutMode;

    if (totalItems === 0 && !open) return null;

    return (
        <>
            {/* Tray Background Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => {
                        setOpen(false);
                        setCheckoutMode(false);
                    }}
                />
            )}

            {/* Tray Side Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out sm:rounded-l-2xl",
                    open ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-xl font-bold">{t("title")}</h2>
                    <button
                        onClick={() => {
                            setOpen(false);
                            setCheckoutMode(false);
                        }}
                        className="rounded-full p-2 hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                    {/* AI Pairing Banner */}
                    <div
                        className={cn(
                            "overflow-hidden transition-all duration-500 ease-in-out",
                            showPairingBanner ? "max-h-32 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0 pointer-events-none"
                        )}
                    >
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 shadow-sm transform transition-transform duration-500 hover:scale-[1.02]">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">👨‍🍳</span>
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-snug">
                                        <b className="font-bold">AI Chef recommends:</b><br />Pair this with crispy Omelette!
                                    </p>
                                </div>
                                <button
                                    onClick={() => addItem({ id: "SF02", name: "Crispy Omelette", price: 12.90 })}
                                    className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-60">
                            <ShoppingCart className="h-16 w-16 mb-4" />
                            <p className="text-lg">{t("empty")}</p>
                        </div>
                    ) : checkoutMode ? (
                        <div className="space-y-6">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-5 rounded-xl text-center shadow-sm">
                                <p className="font-semibold text-xl md:text-2xl text-yellow-900 dark:text-yellow-100">
                                    {t("checkoutInstructions")}
                                </p>
                            </div>

                            {/* Upsell Banner */}
                            {!items.find((i) => i.id === "BV01") && (
                                <div className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-xl p-5 overflow-hidden relative shadow-sm">
                                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
                                        Wait!
                                    </div>
                                    <div className="flex items-start gap-4 mb-4 mt-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1 text-orange-900 dark:text-orange-100 leading-tight">Complete your meal?</h3>
                                            <p className="text-sm text-balance text-orange-700 dark:text-orange-300/80">
                                                Add a Refreshing Lemon Tea for only <strong>RM 4.90</strong>!
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            addItem({ id: "BV01", name: "Refreshing Lemon Tea", price: 4.90 });
                                        }}
                                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Plus className="h-5 w-5" />
                                        Add to Order
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 text-xl font-bold"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center justify-center bg-primary/10 text-primary rounded-lg h-9 w-9 text-base">
                                                {item.quantity}x
                                            </span>
                                            <span>
                                                {item.id} {item.name}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold text-lg">
                                            {item.id} {item.name}
                                        </p>
                                        <p className="text-muted-foreground font-medium">
                                            RM {(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-background border shadow-sm rounded-full p-1">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-6 text-center font-semibold">{item.quantity}</span>
                                        <button
                                            onClick={() => addItem(item)}
                                            className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-muted transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && !checkoutMode && (
                    <div className="border-t p-5 space-y-4 bg-background z-10">
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>{t("total")}</span>
                            <span className="text-primary">RM {totalPrice.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={async () => {
                                setSubmitting(true);
                                try {
                                    await fetch("/api/orders", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ items, total: totalPrice }),
                                    });
                                } catch {
                                    // Non-critical — proceed to checkout regardless
                                } finally {
                                    setSubmitting(false);
                                }
                                setCheckoutMode(true);
                            }}
                            disabled={submitting}
                            className="w-full rounded-full bg-primary py-4 text-primary-foreground font-bold text-lg hover:bg-primary/90 flex justify-center items-center gap-2 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70"
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {submitting ? "Sending…" : t("checkout")}
                        </button>
                    </div>
                )}

                {checkoutMode && (
                    <div className="p-5 bg-background border-t flex gap-3 z-10">
                        <button
                            onClick={() => setCheckoutMode(false)}
                            className="flex-1 rounded-full border-2 border-muted-foreground/20 py-4 font-semibold text-lg hover:bg-muted transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                clearTray();
                                setOpen(false);
                                setCheckoutMode(false);
                            }}
                            className="flex-[2] rounded-full bg-green-600 text-white py-4 font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg active:scale-[0.98]"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>

            {/* Floating button */}
            <button
                onClick={() => setOpen(true)}
                className={cn(
                    "fixed bottom-4 right-20 z-40 flex h-14 items-center justify-center rounded-full bg-orange-500 px-4 text-white shadow-lg transition-transform hover:scale-105 gap-2",
                    open && "hidden"
                )}
                aria-label="View Tray"
            >
                <ShoppingCart className="h-6 w-6" />
                <span className="font-bold text-lg">{totalItems}</span>
            </button>
        </>
    );
}
