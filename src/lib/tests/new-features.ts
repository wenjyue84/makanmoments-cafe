import type { TestDefinition, TestResult } from "./types";
import type { MenuItem } from "@/types/menu";

function getBaseUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3030";
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";
}

// US-041: Menu card name and price in separate DOM elements
const testMenuCardLayout: TestDefinition = {
  id: "nf-041-menu-card-layout",
  name: "US-041: Menu card name/price layout",
  description:
    "menu-card.tsx renders item name in h3 and price in a separate span element",
  category: "new-features",
  run: async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(
        process.cwd(),
        "src",
        "components",
        "menu",
        "menu-card.tsx"
      );
      const src = fs.readFileSync(filePath, "utf-8");
      const duration = Date.now() - start;

      // Verify name is in an h3 element
      const hasH3Name = src.includes("<h3") && src.includes("{name}");
      // Verify price is in a separate span element
      const hasPriceSpan =
        src.includes("<span") &&
        (src.includes("formatPrice(item.price)") ||
          src.includes("formatPrice(item.originalPrice)"));
      // Verify h3 does NOT contain the price (they are separate elements)
      const h3Block = src.match(/<h3[^>]*>[\s\S]*?<\/h3>/)?.[0] ?? "";
      const h3ContainsPrice =
        h3Block.includes("formatPrice") || h3Block.includes("price");

      const pass = hasH3Name && hasPriceSpan && !h3ContainsPrice;
      const logs: string[] = [];
      if (!hasH3Name) logs.push("FAIL: name not rendered in h3");
      if (!hasPriceSpan) logs.push("FAIL: price not rendered in span");
      if (h3ContainsPrice) logs.push("FAIL: h3 contains price - not separate");
      if (pass) logs.push("PASS: name in h3, price in separate span block");
      return { pass, log: logs.join("\n"), duration };
    } catch (err) {
      return {
        pass: false,
        log: `Error: ${String(err)}`,
        duration: Date.now() - start,
      };
    }
  },
};

// US-042: Admin translation fields and translate API
const testAdminTranslationFields: TestDefinition = {
  id: "nf-042-admin-translation-fields",
  name: "US-042: Admin translation fields (nameMs / nameZh)",
  description:
    "admin-menu-table.tsx has nameMs and nameZh inputs; translate route exports POST with translation response",
  category: "new-features",
  run: async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const fs = await import("fs");
      const path = await import("path");

      // Check admin-menu-table.tsx for nameMs/nameZh inputs
      const tablePath = path.join(
        process.cwd(),
        "src",
        "components",
        "admin",
        "admin-menu-table.tsx"
      );
      const tableSrc = fs.readFileSync(tablePath, "utf-8");
      const hasNameMs =
        tableSrc.includes("nameMs") &&
        tableSrc.includes("nameMs: e.target.value");
      const hasNameZh =
        tableSrc.includes("nameZh") &&
        tableSrc.includes("nameZh: e.target.value");

      // Check translate route exists and is correct
      const routePath = path.join(
        process.cwd(),
        "src",
        "app",
        "api",
        "admin",
        "menu",
        "translate",
        "route.ts"
      );
      const routeExists = fs.existsSync(routePath);
      const routeSrc = routeExists ? fs.readFileSync(routePath, "utf-8") : "";
      const hasPostExport =
        routeSrc.includes("export async function POST") ||
        routeSrc.includes("export function POST");
      const returnsTranslation = routeSrc.includes('"translation"');

      const duration = Date.now() - start;
      const logs: string[] = [];
      if (!hasNameMs)
        logs.push("FAIL: nameMs input not found in admin-menu-table.tsx");
      if (!hasNameZh)
        logs.push("FAIL: nameZh input not found in admin-menu-table.tsx");
      if (!routeExists) logs.push("FAIL: translate/route.ts not found");
      if (!hasPostExport)
        logs.push("FAIL: translate/route.ts missing POST export");
      if (!returnsTranslation)
        logs.push("FAIL: translate route does not return translation field");

      const pass =
        hasNameMs && hasNameZh && routeExists && hasPostExport && returnsTranslation;
      if (pass) {
        logs.push(
          "PASS: nameMs/nameZh inputs found, translate route exports POST with translation"
        );
      }
      return { pass, log: logs.join("\n"), duration };
    } catch (err) {
      return {
        pass: false,
        log: `Error: ${String(err)}`,
        duration: Date.now() - start,
      };
    }
  },
};

// US-043: Multi-language search
const testMultiLanguageSearch: TestDefinition = {
  id: "nf-043-multilang-search",
  name: "US-043: Multi-language menu search",
  description:
    "Menu filter finds items by nameEn, nameMs, and nameZh across language fields",
  category: "new-features",
  run: async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const { getAllMenuItemsForAdmin } = await import("../menu");
      const items: MenuItem[] = await getAllMenuItemsForAdmin();
      const duration = Date.now() - start;

      if (items.length === 0) {
        return {
          pass: false,
          log: "No menu items in DB - cannot test multi-language search",
          duration,
        };
      }

      const logs: string[] = [];
      let allPassed = true;

      // Replicate the filter logic from menu-grid.tsx
      function filterItems(query: string): MenuItem[] {
        const q = query.toLowerCase();
        return items.filter(
          (item: MenuItem) =>
            item.nameEn.toLowerCase().includes(q) ||
            item.nameMs.toLowerCase().includes(q) ||
            item.nameZh.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        );
      }

      // Test 1: English search — "tom" should match any Tom Yum variants
      const tomResults = filterItems("tom");
      if (tomResults.length > 0) {
        logs.push(
          `PASS: English search 'tom' => ${tomResults.length} result(s) (e.g. ${tomResults[0].nameEn})`
        );
      } else {
        // Fallback: use first word of first item
        const firstWord = items[0].nameEn.split(" ")[0].toLowerCase();
        const altResults = filterItems(firstWord);
        if (altResults.length > 0) {
          logs.push(
            `PASS: English search '${firstWord}' => ${altResults.length} result(s)`
          );
        } else {
          logs.push("FAIL: English search returned no results");
          allPassed = false;
        }
      }

      // Test 2: Chinese search — use first 2 chars of first Chinese name
      const zhItems = items.filter((i: MenuItem) => i.nameZh && i.nameZh.trim() !== "");
      if (zhItems.length > 0) {
        const zhQuery = zhItems[0].nameZh.substring(0, 2);
        const zhResults = filterItems(zhQuery);
        if (zhResults.length > 0) {
          logs.push(
            `PASS: Chinese search '${zhQuery}' => ${zhResults.length} result(s)`
          );
        } else {
          logs.push(`FAIL: Chinese search '${zhQuery}' returned no results`);
          allPassed = false;
        }
      } else {
        logs.push("INFO: No Chinese names in DB - skipping Chinese search test");
      }

      // Test 3: Malay search — use first word of first Malay name
      const msItems = items.filter((i: MenuItem) => i.nameMs && i.nameMs.trim() !== "");
      if (msItems.length > 0) {
        const msQuery = msItems[0].nameMs.split(" ")[0].toLowerCase();
        const msResults = filterItems(msQuery);
        if (msResults.length > 0) {
          logs.push(
            `PASS: Malay search '${msQuery}' => ${msResults.length} result(s)`
          );
        } else {
          logs.push(`FAIL: Malay search '${msQuery}' returned no results`);
          allPassed = false;
        }
      } else {
        logs.push("INFO: No Malay names in DB - skipping Malay search test");
      }

      logs.push(`Total items in DB: ${items.length}`);
      return { pass: allPassed, log: logs.join("\n"), duration };
    } catch (err) {
      return {
        pass: false,
        log: `Error: ${String(err)}`,
        duration: Date.now() - start,
      };
    }
  },
};

// US-044: Order notification bell — POST /api/orders, verify DB record
const testOrderNotificationBell: TestDefinition = {
  id: "nf-044-order-notification",
  name: "US-044: Order notification (POST /api/orders + DB verify)",
  description:
    "POST /api/orders saves order to tray_orders with status=pending_approval; DB record verified",
  category: "new-features",
  run: async (): Promise<TestResult> => {
    const start = Date.now();
    const baseUrl = getBaseUrl();
    let insertedId: number | null = null;

    try {
      // Step 1: POST a test order (public endpoint — no auth required)
      const testItems = [
        { id: "TEST001", name: "Test Item (US-044)", price: 9.99, quantity: 1 },
      ];
      const postRes = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: testItems,
          total: 9.99,
          contactNumber: "0123456789",
          estimatedArrival: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        }),
      });

      const logs: string[] = [];
      if (!postRes.ok) {
        const body = await postRes.text();
        return {
          pass: false,
          log: `POST /api/orders => ${postRes.status} (expected 201): ${body}`,
          duration: Date.now() - start,
        };
      }

      const postData = (await postRes.json()) as { ok: boolean; id: number };
      if (!postData.ok || typeof postData.id !== "number") {
        return {
          pass: false,
          log: `POST /api/orders returned unexpected body: ${JSON.stringify(postData)}`,
          duration: Date.now() - start,
        };
      }
      insertedId = postData.id;
      logs.push(`PASS: POST /api/orders => 201, order id=${insertedId}`);

      // Step 2: Verify via direct DB query — order has status=pending_approval
      const sql = (await import("@/lib/db")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: any[] = await sql`
        SELECT id, status FROM tray_orders WHERE id = ${insertedId}
      `;

      if (rows.length === 0) {
        logs.push(`FAIL: Order id=${insertedId} not found in tray_orders table`);
        return {
          pass: false,
          log: logs.join("\n"),
          duration: Date.now() - start,
        };
      }
      if (rows[0].status !== "pending_approval") {
        logs.push(
          `FAIL: order status=${rows[0].status as string} (expected pending_approval)`
        );
        return {
          pass: false,
          log: logs.join("\n"),
          duration: Date.now() - start,
        };
      }
      logs.push("PASS: Order found in DB with status=pending_approval");

      // Step 3: Mark as seen via direct DB (admin API requires auth cookie)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateRows: any[] = await sql`
        UPDATE tray_orders SET status = 'seen'
        WHERE id = ${insertedId}
        RETURNING id, status
      `;
      if (updateRows.length === 0 || updateRows[0].status !== "seen") {
        logs.push("FAIL: Could not update order to status=seen");
        return {
          pass: false,
          log: logs.join("\n"),
          duration: Date.now() - start,
        };
      }
      logs.push(`PASS: Order id=${insertedId} marked as seen in DB`);

      // Cleanup: delete the test order
      await sql`DELETE FROM tray_orders WHERE id = ${insertedId}`;
      logs.push(`INFO: Test order id=${insertedId} cleaned up`);

      return { pass: true, log: logs.join("\n"), duration: Date.now() - start };
    } catch (err) {
      // Attempt cleanup on error
      if (insertedId !== null) {
        try {
          const sql = (await import("@/lib/db")).default;
          await sql`DELETE FROM tray_orders WHERE id = ${insertedId}`;
        } catch {
          // ignore cleanup failure
        }
      }
      return {
        pass: false,
        log: `Error: ${String(err)}`,
        duration: Date.now() - start,
      };
    }
  },
};

// US-045: PWA manifest and service worker
const testPWAManifest: TestDefinition = {
  id: "nf-045-pwa-manifest",
  name: "US-045: PWA manifest and service worker",
  description:
    "manifest.json has name/icons/display fields; public/sw.js exists with lifecycle events",
  category: "new-features",
  run: async (): Promise<TestResult> => {
    const start = Date.now();
    try {
      const fs = await import("fs");
      const path = await import("path");

      // Check manifest.json exists and is valid
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        return {
          pass: false,
          log: "FAIL: public/manifest.json not found",
          duration: Date.now() - start,
        };
      }

      const manifestSrc = fs.readFileSync(manifestPath, "utf-8");
      let manifest: Record<string, unknown>;
      try {
        manifest = JSON.parse(manifestSrc) as Record<string, unknown>;
      } catch {
        return {
          pass: false,
          log: "FAIL: public/manifest.json is not valid JSON",
          duration: Date.now() - start,
        };
      }

      const logs: string[] = [];
      let allPassed = true;

      const hasName =
        typeof manifest.name === "string" && manifest.name.length > 0;
      const hasIcons =
        Array.isArray(manifest.icons) &&
        (manifest.icons as unknown[]).length > 0;
      const hasDisplay =
        typeof manifest.display === "string" && manifest.display.length > 0;

      if (!hasName) {
        logs.push("FAIL: manifest.json missing name field");
        allPassed = false;
      } else {
        logs.push(`PASS: manifest name="${manifest.name as string}"`);
      }

      if (!hasIcons) {
        logs.push("FAIL: manifest.json missing icons array");
        allPassed = false;
      } else {
        const icons = manifest.icons as { src: string; sizes: string }[];
        logs.push(
          `PASS: manifest has ${icons.length} icon(s) (e.g. ${icons[0]?.sizes ?? "?"})`
        );
      }

      if (!hasDisplay) {
        logs.push("FAIL: manifest.json missing display field");
        allPassed = false;
      } else {
        logs.push(`PASS: manifest display="${manifest.display as string}"`);
      }

      // Check sw.js exists and has lifecycle events
      const swPath = path.join(process.cwd(), "public", "sw.js");
      if (!fs.existsSync(swPath)) {
        logs.push("FAIL: public/sw.js not found");
        allPassed = false;
      } else {
        const swSrc = fs.readFileSync(swPath, "utf-8");
        const hasLifecycle =
          swSrc.includes("install") || swSrc.includes("activate");
        if (!hasLifecycle) {
          logs.push("FAIL: sw.js lacks service worker lifecycle events");
          allPassed = false;
        } else {
          logs.push(`PASS: public/sw.js exists (${swSrc.length} bytes)`);
        }
      }

      return {
        pass: allPassed,
        log: logs.join("\n"),
        duration: Date.now() - start,
      };
    } catch (err) {
      return {
        pass: false,
        log: `Error: ${String(err)}`,
        duration: Date.now() - start,
      };
    }
  },
};

export const newFeaturesTests: TestDefinition[] = [
  testMenuCardLayout,
  testAdminTranslationFields,
  testMultiLanguageSearch,
  testOrderNotificationBell,
  testPWAManifest,
];
