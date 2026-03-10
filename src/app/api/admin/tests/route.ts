import { NextResponse, type NextRequest } from "next/server";
import { getTestMeta, getTestById, ALL_TESTS } from "@/lib/tests";
import type { StreamEvent } from "@/lib/tests";

export const runtime = "nodejs";

// GET /api/admin/tests — list all test definitions (metadata only)
export async function GET() {
  return NextResponse.json(getTestMeta());
}

// POST /api/admin/tests — run tests and stream results as NDJSON
// Body: { ids: string[] } — array of test IDs to run, or omit for all
export async function POST(request: NextRequest) {
  let ids: string[] | undefined;
  try {
    const body = await request.json() as { ids?: string[] };
    ids = body.ids;
  } catch {
    // empty body = run all
  }

  const testsToRun = ids && ids.length > 0
    ? ids.map((id) => getTestById(id)).filter(Boolean)
    : ALL_TESTS;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const runStart = Date.now();
      let passed = 0;
      let failed = 0;

      for (const test of testsToRun) {
        if (!test) continue;

        // Send start event
        const startEvent: StreamEvent = { type: "start", id: test.id };
        controller.enqueue(encoder.encode(JSON.stringify(startEvent) + "\n"));

        // Run the test
        let result;
        try {
          result = await test.run();
        } catch (err) {
          result = { pass: false, log: `Unexpected error: ${String(err)}`, duration: 0 };
        }

        if (result.pass) passed++;
        else failed++;

        // Send result event
        const resultEvent: StreamEvent = {
          type: "result",
          id: test.id,
          pass: result.pass,
          log: result.log,
          duration: result.duration,
        };
        controller.enqueue(encoder.encode(JSON.stringify(resultEvent) + "\n"));
      }

      // Send done event
      const doneEvent: StreamEvent = {
        type: "done",
        total: passed + failed,
        passed,
        failed,
        duration: Date.now() - runStart,
      };
      controller.enqueue(encoder.encode(JSON.stringify(doneEvent) + "\n"));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
