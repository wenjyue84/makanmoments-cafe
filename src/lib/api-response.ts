import { NextResponse } from "next/server";

export function createErrorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
