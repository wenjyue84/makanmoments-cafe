import type { ReactNode } from "react";
import "../globals.css";

export const metadata = {
  title: "Kitchen Display | Makan Moments",
};

export default function KdsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
