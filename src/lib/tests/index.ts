export type { TestResult, TestDefinition, TestMeta, TestCategory, StreamEvent } from "./types";
export { smokeTests } from "./smoke";
export { unitTests } from "./unit";
export { integrationTests } from "./integration";
export { e2eTests } from "./e2e";

import { smokeTests } from "./smoke";
import { unitTests } from "./unit";
import { integrationTests } from "./integration";
import { e2eTests } from "./e2e";
import type { TestDefinition, TestMeta } from "./types";

export const ALL_TESTS: TestDefinition[] = [
  ...smokeTests,
  ...unitTests,
  ...integrationTests,
  ...e2eTests,
];

export function getTestMeta(): TestMeta[] {
  return ALL_TESTS.map(({ id, name, description, category }) => ({
    id,
    name,
    description,
    category,
  }));
}

export function getTestById(id: string): TestDefinition | undefined {
  return ALL_TESTS.find((t) => t.id === id);
}
