import { NextResponse, type NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import type { TestMeta } from "@/lib/tests";

export const runtime = "nodejs";

interface FailedTest {
  id: string;
  name: string;
  log: string;
}

interface PrdStory {
  id: string;
  title: string;
  priority: number;
  description: string;
  acceptanceCriteria: string[];
  technicalNotes: string[];
  dependencies: string[];
  estimatedComplexity: string;
  passes: boolean;
}

interface PrdJson {
  userStories: PrdStory[];
  [key: string]: unknown;
}

const PRD_FILE = path.join(process.cwd(), "prd.json");

export async function POST(request: NextRequest) {
  let failedTests: FailedTest[] = [];
  try {
    const body = await request.json() as { failedTests?: FailedTest[] };
    failedTests = body.failedTests ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (failedTests.length === 0) {
    return NextResponse.json({ ok: true, added: 0, message: "No failing tests to generate stories for" });
  }

  try {
    const raw = fs.readFileSync(PRD_FILE, "utf-8");
    const prd = JSON.parse(raw) as PrdJson;

    const existingIds = new Set(prd.userStories.map((s) => s.id));
    const maxPriority = Math.max(...prd.userStories.map((s) => s.priority ?? 0), 0);

    const newStories: PrdStory[] = [];

    failedTests.forEach((test: FailedTest, i: number) => {
      const newId = `US-FIX-${test.id}`;
      if (existingIds.has(newId)) return;

      newStories.push({
        id: newId,
        title: `Fix failing test: ${test.name}`,
        priority: maxPriority + i + 1,
        description: `Auto-generated from failing test "${test.id}". Last failure: ${test.log}`,
        acceptanceCriteria: [
          `Test "${test.name}" passes in the admin Tests tab`,
          `Running "${test.id}" returns pass: true`,
        ],
        technicalNotes: [
          `Failing test ID: ${test.id}`,
          `Last failure log: ${test.log}`,
        ],
        dependencies: [],
        estimatedComplexity: "small",
        passes: false,
      });
    });

    if (newStories.length === 0) {
      return NextResponse.json({ ok: true, added: 0, message: "Stories already exist for all failing tests" });
    }

    prd.userStories = [...prd.userStories, ...newStories];
    fs.writeFileSync(PRD_FILE, JSON.stringify(prd, null, 2) + "\n", "utf-8");

    return NextResponse.json({
      ok: true,
      added: newStories.length,
      stories: newStories.map((s: PrdStory) => ({ id: s.id, title: s.title })),
    });
  } catch (err) {
    console.error("Failed to generate stories:", err);
    return NextResponse.json({ error: "Failed to update prd.json" }, { status: 500 });
  }
}

// Also export the test meta type for external use
export type { TestMeta };
