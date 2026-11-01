/** Instant placeholder shown while a catalog page is being rendered on the server. */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6" aria-busy="true">
      <div className="mb-8 space-y-3">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-surface" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-surface" />
      </div>
      <div className="h-12 animate-pulse rounded-full bg-surface" />
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="space-y-3">
            <div className="aspect-[4/5] animate-pulse rounded-card bg-surface" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
          </li>
        ))}
      </ul>
    </div>
  );
}
