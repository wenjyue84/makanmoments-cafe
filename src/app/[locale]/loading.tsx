export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="h-12 w-72 animate-pulse rounded-lg bg-muted" />
              <div className="mt-6 h-6 w-96 animate-pulse rounded-lg bg-muted" />
              <div className="mt-8 flex gap-4">
                <div className="h-12 w-36 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="relative aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted lg:hidden" />
          </div>
        </div>
      </section>

      {/* Info strip skeleton */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
