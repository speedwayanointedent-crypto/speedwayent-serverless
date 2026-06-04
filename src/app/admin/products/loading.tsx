export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 text-foreground" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-32" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="skeleton h-9 w-24 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-lg" />
          <div className="skeleton h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="skeleton h-10 w-full max-w-md rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-lg" />
        </div>
        <div className="skeleton h-4 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="p-4 space-y-3">
              <div className="skeleton h-3 w-1/3 rounded-md" />
              <div className="skeleton h-4 w-3/4 rounded-md" />
              <div className="flex items-center gap-2 pt-1">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="skeleton h-6 w-20 rounded-md" />
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
