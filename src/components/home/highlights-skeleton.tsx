export function HighlightsSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto mt-2 h-5 w-64 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 aspect-[4/3] animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
