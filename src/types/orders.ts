export type OrderStatus =
  | "pending_approval"
  | "approved"
  | "payment_pending"
  | "payment_uploaded"
  | "preparing"
  | "ready"
  | "rejected"
  | "cancelled"
  | "expired";

export const STATUS_STEPS = [
  "pending_approval",
  "approved",
  "payment_pending",
  "payment_uploaded",
  "preparing",
  "ready",
] as const;

export const TERMINAL_STATUSES: OrderStatus[] = [
  "ready",
  "rejected",
  "cancelled",
  "expired",
];
