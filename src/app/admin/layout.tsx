import type { ReactNode } from "react";
import "../globals.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      {/* Strip any dark-mode class that may have persisted from a client-side navigation */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('dark');`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
