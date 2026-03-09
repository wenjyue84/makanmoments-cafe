import type { TestDefinition, TestResult } from "./types";

export const integrationTests: TestDefinition[] = [
  {
    id: "integration-env-vars",
    name: "Required env vars present",
    description: "NOTION_API_KEY, DATABASE_URL, ADMIN_JWT_SECRET are set",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const required = ["NOTION_API_KEY", "DATABASE_URL", "ADMIN_JWT_SECRET"];
      const missing = required.filter((k) => !process.env[k]);
      const duration = Date.now() - start;
      if (missing.length === 0) {
        return { pass: true, log: `All required env vars present: ${required.join(", ")}`, duration };
      }
      return { pass: false, log: `Missing env vars: ${missing.join(", ")}`, duration };
    },
  },
  {
    id: "integration-db",
    name: "Database connection",
    description: "Neon DB responds to SELECT 1",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      try {
        if (!process.env.DATABASE_URL) {
          return { pass: false, log: "DATABASE_URL not set — skipping DB test", duration: 0 };
        }
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql`SELECT 1 AS ok`;
        const duration = Date.now() - start;
        const ok = Array.isArray(rows) && rows.length > 0;
        return {
          pass: ok,
          log: ok ? `DB responded in ${duration}ms` : "DB returned empty response",
          duration,
        };
      } catch (err) {
        return { pass: false, log: `DB error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
  {
    id: "integration-menu-fetch",
    name: "Menu data fetch",
    description: "getCategories() returns an array from Neon DB",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      try {
        const { getCategories } = await import("../menu");
        const cats = await getCategories();
        const duration = Date.now() - start;
        if (Array.isArray(cats)) {
          return {
            pass: true,
            log: `getCategories() returned ${cats.length} categories in ${duration}ms`,
            duration,
          };
        }
        return { pass: false, log: "getCategories() did not return an array", duration };
      } catch (err) {
        return { pass: false, log: `Error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
  {
    id: "integration-api-admin-menu",
    name: "Admin menu API (unauthenticated)",
    description: "GET /api/admin/menu without auth returns non-200 (protected)",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";
      try {
        const res = await fetch(`${baseUrl}/api/admin/menu`, {
          redirect: "manual",
          credentials: "omit",
        });
        const duration = Date.now() - start;
        // Middleware redirects to /admin/login (status 307) or returns 401/403
        // Any non-200 response means the route is protected
        const protected_ = res.status !== 200;
        return {
          pass: protected_,
          log: protected_
            ? `Admin menu API returned ${res.status} (route is protected) in ${duration}ms`
            : `Admin menu API returned 200 without auth — route is NOT protected! (${duration}ms)`,
          duration,
        };
      } catch (err) {
        return { pass: false, log: `Error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
];
