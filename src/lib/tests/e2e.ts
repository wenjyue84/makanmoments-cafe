import type { TestDefinition, TestResult } from "./types";

function getBaseUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3030";
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3030";
}

async function fetchHtml(path: string): Promise<{ ok: boolean; html: string; status: number }> {
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, { redirect: "follow" });
    const html = await res.text();
    return { ok: res.ok, html, status: res.status };
  } catch {
    return { ok: false, html: "", status: 0 };
  }
}

export const e2eTests: TestDefinition[] = [
  {
    id: "e2e-homepage-content",
    name: "Homepage renders cafe name",
    description: "Homepage HTML contains 'Makan Moments' or the cafe name",
    category: "e2e",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const { ok, html } = await fetchHtml("/en");
      const duration = Date.now() - start;
      if (!ok) return { pass: false, log: `Homepage failed to load`, duration };
      const hasCafeName = html.includes("Makan Moments") || html.includes("食光记忆");
      return {
        pass: hasCafeName,
        log: hasCafeName
          ? `Homepage contains cafe name (${duration}ms)`
          : `Homepage loaded but cafe name not found in HTML (${duration}ms)`,
        duration,
      };
    },
  },
  {
    id: "e2e-menu-has-items",
    name: "Menu page renders items",
    description: "Menu page HTML contains at least one menu item (RM price visible)",
    category: "e2e",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const { ok, html } = await fetchHtml("/en/menu");
      const duration = Date.now() - start;
      if (!ok) return { pass: false, log: `Menu page failed to load`, duration };
      const hasPrices = html.includes("RM");
      return {
        pass: hasPrices,
        log: hasPrices
          ? `Menu page contains RM price (${duration}ms)`
          : `Menu page loaded but no RM prices found in HTML (${duration}ms)`,
        duration,
      };
    },
  },
  {
    id: "e2e-contact-address",
    name: "Contact page has address",
    description: "Contact page HTML contains Skudai address",
    category: "e2e",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const { ok, html } = await fetchHtml("/en/contact");
      const duration = Date.now() - start;
      if (!ok) return { pass: false, log: `Contact page failed to load`, duration };
      const hasAddress = html.includes("Skudai") || html.includes("Impian Emas");
      return {
        pass: hasAddress,
        log: hasAddress
          ? `Contact page contains Skudai address (${duration}ms)`
          : `Contact page loaded but address not found in HTML (${duration}ms)`,
        duration,
      };
    },
  },
  {
    id: "e2e-i18n-ms",
    name: "Malay locale loads",
    description: "GET /ms returns HTTP 200 (i18n routing works)",
    category: "e2e",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const { ok, status } = await fetchHtml("/ms");
      const duration = Date.now() - start;
      return {
        pass: ok,
        log: ok
          ? `Malay locale /ms → ${status} OK (${duration}ms)`
          : `Malay locale /ms → ${status} (expected 200) (${duration}ms)`,
        duration,
      };
    },
  },
  {
    id: "e2e-i18n-zh",
    name: "Chinese locale loads",
    description: "GET /zh returns HTTP 200 (i18n routing works)",
    category: "e2e",
    run: async (): Promise<TestResult> => {
      const start = Date.now();
      const { ok, status } = await fetchHtml("/zh");
      const duration = Date.now() - start;
      return {
        pass: ok,
        log: ok
          ? `Chinese locale /zh → ${status} OK (${duration}ms)`
          : `Chinese locale /zh → ${status} (expected 200) (${duration}ms)`,
        duration,
      };
    },
  },
];
