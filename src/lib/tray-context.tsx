"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TrayItem = {
    id: string; // The item ID (e.g., "BF01")
    name: string; // The generic name
    price: number;
    quantity: number;
};

type TrayContextType = {
    items: TrayItem[];
    addItem: (item: Omit<TrayItem, "quantity">) => void;
    removeItem: (id: string) => void;
    decrementItem: (id: string) => void;
    clearTray: () => void;
    totalPrice: number;
};

const TrayContext = createContext<TrayContextType | undefined>(undefined);

export function TrayProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<TrayItem[]>([]);

    const addItem = (newItem: Omit<TrayItem, "quantity">) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === newItem.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...newItem, quantity: 1 }];
        });
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const decrementItem = (id: string) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === id);
            if (!existing) return prev;
            if (existing.quantity <= 1) return prev.filter((item) => item.id !== id);
            return prev.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
    };

    const clearTray = () => setItems([]);

    const totalPrice = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return (
        <TrayContext.Provider
            value={{ items, addItem, removeItem, decrementItem, clearTray, totalPrice }}
        >
            {children}
        </TrayContext.Provider>
    );
}

export function useTray() {
    const context = useContext(TrayContext);
    if (context === undefined) {
        throw new Error("useTray must be used within a TrayProvider");
    }
    return context;
}
