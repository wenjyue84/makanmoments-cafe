export interface TestResult {
  pass: boolean;
  log: string;
  duration: number;
}

export type TestCategory = "smoke" | "unit" | "integration" | "e2e" | "new-features" | "pre-order" | "reliability";

export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  run: () => Promise<TestResult>;
}

export interface TestMeta {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
}

export type StreamEvent =
  | { type: "start"; id: string }
  | { type: "result"; id: string; pass: boolean; log: string; duration: number }
  | { type: "done"; total: number; passed: number; failed: number; duration: number };
