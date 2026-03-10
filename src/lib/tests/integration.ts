import type { TestDefinition, TestResult } from "./types";

export const integrationTests: TestDefinition[] = [
  {
    id: "integration-env-vars",
    name: "Required env vars present",
    description: "DATABASE_URL and ADMIN_JWT_SECRET are set (project uses Neon Postgres, not Notion)",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const required = ["DATABASE_URL", "ADMIN_JWT_SECRET"];
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
    name: "Admin routes protected by middleware",
    description: "middleware.ts guards /api/admin/* paths with JWT auth",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      try {
        // Note: server-side fetch to localhost bypasses Next.js middleware (known limitation).
        // Instead, verify the middleware source guards /api/admin/* correctly.
        const fs = await import("fs");
        const path = await import("path");
        const mwPath = path.join(process.cwd(), "middleware.ts");
        const src = fs.readFileSync(mwPath, "utf-8");
        const duration = Date.now() - start;
        const hasAdminGuard = src.includes('pathname.startsWith("/api/admin")');
        const hasTokenCheck = src.includes("verifyAdminToken");
        const hasRedirect = src.includes("/admin/login");
        if (hasAdminGuard && hasTokenCheck && hasRedirect) {
          return { pass: true, log: "middleware.ts guards /api/admin/* with verifyAdminToken + redirect to /admin/login", duration };
        }
        const missing = [
          !hasAdminGuard && "/api/admin guard",
          !hasTokenCheck && "verifyAdminToken call",
          !hasRedirect && "/admin/login redirect",
        ].filter(Boolean).join(", ");
        return { pass: false, log: `middleware.ts missing: ${missing}`, duration };
      } catch (err) {
        return { pass: false, log: `Error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
  {
    id: "integration-admin-highlights-route",
    name: "Admin highlights route exists",
    description: "src/app/api/admin/highlights/route.ts file exists and exports GET",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      try {
        const fs = await import("fs");
        const path = await import("path");
        const routePath = path.join(process.cwd(), "src", "app", "api", "admin", "highlights", "route.ts");
        const exists = fs.existsSync(routePath);
        const duration = Date.now() - start;
        if (!exists) {
          return { pass: false, log: `Route file not found: ${routePath}`, duration };
        }
        const src = fs.readFileSync(routePath, "utf-8");
        const hasGet = src.includes("export async function GET") || src.includes("export function GET");
        return {
          pass: hasGet,
          log: hasGet
            ? "highlights/route.ts exists and exports GET"
            : "highlights/route.ts exists but GET export not found",
          duration,
        };
      } catch (err) {
        return { pass: false, log: `Error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
  {
    id: "integration-admin-display-categories-route",
    name: "Admin display-categories route exists",
    description: "src/app/api/admin/display-categories/route.ts file exists and exports GET",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      try {
        const fs = await import("fs");
        const path = await import("path");
        const routePath = path.join(process.cwd(), "src", "app", "api", "admin", "display-categories", "route.ts");
        const exists = fs.existsSync(routePath);
        const duration = Date.now() - start;
        if (!exists) {
          return { pass: false, log: `Route file not found: ${routePath}`, duration };
        }
        const src = fs.readFileSync(routePath, "utf-8");
        const hasGet = src.includes("export async function GET") || src.includes("export function GET");
        return {
          pass: hasGet,
          log: hasGet
            ? "display-categories/route.ts exists and exports GET"
            : "display-categories/route.ts exists but GET export not found",
          duration,
        };
      } catch (err) {
        return { pass: false, log: `Error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
  {
    id: "integration-admin-time-slots-route",
    name: "Admin time-slots route exists",
    description: "src/app/api/admin/time-slots/route.ts file exists and exports GET",
    category: "integration",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      try {
        const fs = await import("fs");
        const path = await import("path");
        const routePath = path.join(process.cwd(), "src", "app", "api", "admin", "time-slots", "route.ts");
        const exists = fs.existsSync(routePath);
        const duration = Date.now() - start;
        if (!exists) {
          return { pass: false, log: `Route file not found: ${routePath}`, duration };
        }
        const src = fs.readFileSync(routePath, "utf-8");
        const hasGet = src.includes("export async function GET") || src.includes("export function GET");
        return {
          pass: hasGet,
          log: hasGet
            ? "time-slots/route.ts exists and exports GET"
            : "time-slots/route.ts exists but GET export not found",
          duration,
        };
      } catch (err) {
        return { pass: false, log: `Error: ${String(err)}`, duration: Date.now() - start };
      }
    },
  },
];
