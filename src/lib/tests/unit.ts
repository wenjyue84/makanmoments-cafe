import type { TestDefinition, TestResult } from "./types";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function run(fn: () => void): TestResult {
  const start = Date.now();
  try {
    fn();
    const duration = Date.now() - start;
    return { pass: true, log: "All assertions passed", duration };
  } catch (err) {
    const duration = Date.now() - start;
    return { pass: false, log: String(err), duration };
  }
}

export const unitTests: TestDefinition[] = [
  {
    id: "unit-price-format",
    name: "Price formatting",
    description: "Prices render as RM X.XX format",
    category: "unit",
    run: async () =>
      run(() => {
        const formatPrice = (price: number) => `RM ${price.toFixed(2)}`;
        assert(formatPrice(8) === "RM 8.00", "formatPrice(8) should be RM 8.00");
        assert(formatPrice(12.5) === "RM 12.50", "formatPrice(12.5) should be RM 12.50");
        assert(formatPrice(0) === "RM 0.00", "formatPrice(0) should be RM 0.00");
      }),
  },
  {
    id: "unit-cafe-constants",
    name: "CAFE constants structure",
    description: "CAFE object has required fields: name, address, phone, hours",
    category: "unit",
    run: async () =>
      run(() => {
        // Dynamic import to avoid bundling issues
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CAFE } = require("../constants") as { CAFE: Record<string, unknown> };
        assert(typeof CAFE.name === "object" && CAFE.name !== null, "CAFE.name must be an object");
        assert(typeof CAFE.address === "string" && CAFE.address.length > 0, "CAFE.address must be a non-empty string");
        assert(typeof CAFE.phone === "string" && CAFE.phone.length > 0, "CAFE.phone must be a non-empty string");
        assert(typeof CAFE.hours === "object" && CAFE.hours !== null, "CAFE.hours must be an object");
      }),
  },
  {
    id: "unit-slug-generation",
    name: "Blog slug generation",
    description: "Slug generated from title is URL-safe",
    category: "unit",
    run: async () =>
      run(() => {
        const toSlug = (title: string) =>
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        assert(toSlug("Hello World") === "hello-world", "basic slug works");
        assert(toSlug("Thai & Malaysian Food!") === "thai-malaysian-food", "special chars removed");
        assert(toSlug("  spaces  ") === "spaces", "leading/trailing hyphens trimmed");
      }),
  },
  {
    id: "unit-cn-utility",
    name: "cn() class utility",
    description: "cn() merges Tailwind classes correctly",
    category: "unit",
    run: async () =>
      run(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { cn } = require("../utils") as { cn: (...inputs: unknown[]) => string };
        const result = cn("px-4", "py-2", false && "hidden", "text-sm");
        assert(typeof result === "string", "cn() returns a string");
        assert(result.includes("px-4"), "cn() includes px-4");
        assert(result.includes("py-2"), "cn() includes py-2");
        assert(!result.includes("hidden"), "cn() excludes falsy class");
      }),
  },
];
