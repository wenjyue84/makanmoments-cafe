// This route is protected by middleware — if the request reaches here the
// admin JWT was already validated. It simply returns 200 so client code can
// check whether the current session is authenticated without needing to
// redirect to a page route.
export async function GET() {
  return Response.json({ ok: true });
}
