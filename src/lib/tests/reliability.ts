import type { TestDefinition, TestResult } from "./types";

function getBaseUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3030";
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";
}

async function testChatApiResponds(): Promise<TestResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${getBaseUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", parts: [{ type: "text", text: "hello" }] }],
      }),
      signal: controller.signal,
    });
    const duration = Date.now() - start;
    clearTimeout(timeout);
    if (res.ok || res.status === 200) {
      return { pass: true, log: `POST /api/chat → ${res.status} OK (${duration}ms)`, duration };
    }
    return {
      pass: false,
      log: `POST /api/chat → ${res.status} (expected 200) (${duration}ms)`,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - start;
    clearTimeout(timeout);
    const msg = err instanceof Error && err.name === "AbortError" ? "Timed out after 5s" : String(err);
    return { pass: false, log: `POST /api/chat → Error: ${msg} (${duration}ms)`, duration };
  }
}

async function testOrdersValidation(): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${getBaseUrl()}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const duration = Date.now() - start;
    if (res.status === 400) {
      return { pass: true, log: `POST /api/orders (empty body) → 400 Bad Request (${duration}ms)`, duration };
    }
    return {
      pass: false,
      log: `POST /api/orders (empty body) → ${res.status} (expected 400) (${duration}ms)`,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return { pass: false, log: `POST /api/orders → Error: ${String(err)}`, duration };
  }
}

async function testMenuApiReturnsItems(): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${getBaseUrl()}/api/admin/menu`, {
      headers: { Cookie: "" },
    });
    const duration = Date.now() - start;
    if (res.status === 401) {
      return {
        pass: true,
        log: `GET /api/admin/menu (no auth) → 401 Unauthorized — auth gate working (${duration}ms)`,
        duration,
      };
    }
    if (!res.ok) {
      return {
        pass: false,
        log: `GET /api/admin/menu → ${res.status} (expected 200 or 401) (${duration}ms)`,
        duration,
      };
    }
    const data = await res.json() as unknown;
    const items = Array.isArray(data) ? data : (data as { items?: unknown[] })?.items;
    if (Array.isArray(items) && items.length > 0) {
      return { pass: true, log: `GET /api/admin/menu → ${items.length} items returned (${duration}ms)`, duration };
    }
    return {
      pass: false,
      log: `GET /api/admin/menu → empty or unexpected response (${duration}ms)`,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return { pass: false, log: `GET /api/admin/menu → Error: ${String(err)}`, duration };
  }
}

async function testAdminSettingsRejects401(): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${getBaseUrl()}/api/admin/settings`, {
      headers: { Authorization: "Bearer invalid-token-xyz" },
    });
    const duration = Date.now() - start;
    if (res.status === 401) {
      return { pass: true, log: `GET /api/admin/settings (invalid token) → 401 Unauthorized (${duration}ms)`, duration };
    }
    return {
      pass: false,
      log: `GET /api/admin/settings (invalid token) → ${res.status} (expected 401) (${duration}ms)`,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return { pass: false, log: `GET /api/admin/settings → Error: ${String(err)}`, duration };
  }
}

async function testOrderStatus404(): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${getBaseUrl()}/api/orders/test-nonexistent-id`);
    const duration = Date.now() - start;
    if (res.status === 404) {
      return { pass: true, log: `GET /api/orders/test-nonexistent-id → 404 Not Found (${duration}ms)`, duration };
    }
    return {
      pass: false,
      log: `GET /api/orders/test-nonexistent-id → ${res.status} (expected 404) (${duration}ms)`,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - start;
    return { pass: false, log: `GET /api/orders/test-nonexistent-id → Error: ${String(err)}`, duration };
  }
}

export const reliabilityTests: TestDefinition[] = [
  {
    id: "reliability-chat-api",
    name: "Chat API responds within 5s",
    description: "POST /api/chat with a simple message returns 200 within 5 seconds",
    category: "reliability",
    run: testChatApiResponds,
  },
  {
    id: "reliability-orders-validation",
    name: "Orders API validates input",
    description: "POST /api/orders with empty body returns 400 Bad Request",
    category: "reliability",
    run: testOrdersValidation,
  },
  {
    id: "reliability-menu-api",
    name: "Menu API returns items",
    description: "GET /api/admin/menu returns a non-empty items array (or 401 for auth gate)",
    category: "reliability",
    run: testMenuApiReturnsItems,
  },
  {
    id: "reliability-admin-auth",
    name: "Admin settings rejects invalid token",
    description: "GET /api/admin/settings with invalid Bearer token returns 401",
    category: "reliability",
    run: testAdminSettingsRejects401,
  },
  {
    id: "reliability-order-404",
    name: "Order status returns 404 for unknown ID",
    description: "GET /api/orders/test-nonexistent-id returns 404 Not Found",
    category: "reliability",
    run: testOrderStatus404,
  },
];
