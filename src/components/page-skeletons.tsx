import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-36" /> : null}
    </div>
  );
}

function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-5"
        >
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/60">
      <div className="flex gap-6 border-b border-border/70 px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="flex items-center gap-6 border-b border-border/50 px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton
              key={c}
              className={c === 0 ? "h-4 flex-[1.4]" : "h-4 flex-1"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListPageSkeleton({
  stats = 0,
  action = false,
  cols = 5,
}: {
  stats?: number;
  action?: boolean;
  cols?: number;
}) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton action={action} />
      {stats > 0 ? <StatCardsSkeleton count={stats} /> : null}
      <TableSkeleton cols={cols} />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-28" />
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
        <Skeleton className="min-h-72 rounded-xl" />
      </div>
    </div>
  );
}
