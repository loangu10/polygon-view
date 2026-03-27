function SkeletonLine({
  className,
}: {
  className: string;
}) {
  return <div className={`rounded-full bg-slate-200 ${className}`} />;
}

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`rounded-2xl bg-slate-200 ${className}`} />;
}

function HealthMetricCardLoading() {
  return (
    <article className="surface animate-pulse rounded-[24px] p-4">
      <SkeletonLine className="h-5 w-28" />
      <SkeletonLine className="mt-3 h-10 w-28" />
      <div className="mt-6 flex items-baseline gap-2">
        <SkeletonLine className="h-8 w-28" />
        <SkeletonLine className="h-4 w-20" />
      </div>
      <SkeletonLine className="mt-4 h-6 w-24" />
      <SkeletonLine className="mt-3 h-5 w-32" />
    </article>
  );
}

export function ResultsCardLoading() {
  return (
    <section className="surface animate-pulse overflow-hidden rounded-[28px] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <SkeletonLine className="h-6 w-20" />
          <SkeletonLine className="mt-2 h-4 w-36" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2">
          <SkeletonBlock className="h-4 w-4" />
        </div>
      </div>
      <div className="px-1">
        <div className="flex items-baseline gap-2">
          <SkeletonLine className="h-8 w-20" />
          <SkeletonLine className="h-7 w-28" />
          <SkeletonLine className="h-5 w-20" />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2"
          >
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="mt-3 h-6 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentLiveBetsLoading() {
  return (
    <section className="surface w-full animate-pulse overflow-hidden rounded-[28px] p-4 sm:p-5">
      <SkeletonLine className="h-6 w-36" />
      <SkeletonLine className="mt-2 h-4 w-44" />
      <div className="mt-3 grid gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
          >
            <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:gap-3 sm:space-y-0">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-5 w-40" />
                <SkeletonLine className="h-4 w-56 max-w-full" />
                <SkeletonLine className="h-4 w-32" />
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:space-y-2">
                <SkeletonLine className="h-7 w-20" />
                <SkeletonLine className="ml-auto h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JobsCardLoading() {
  return (
    <section className="surface w-full animate-pulse overflow-hidden rounded-[28px] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <SkeletonLine className="h-6 w-14" />
          <SkeletonLine className="mt-2 h-4 w-24" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2">
          <SkeletonBlock className="h-4 w-4" />
        </div>
      </div>
      <div className="grid gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <SkeletonLine className="h-5 w-36" />
              <SkeletonLine className="h-6 w-16" />
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <SkeletonLine className="h-4 w-16" />
              <SkeletonLine className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ResultsTableLoading() {
  return (
    <section className="surface w-full animate-pulse overflow-hidden rounded-[28px] p-4 sm:p-5">
      <div className="mb-4">
        <SkeletonLine className="h-6 w-24" />
        <SkeletonLine className="mt-2 h-4 w-44" />
      </div>

      <div className="grid gap-2 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-5 w-40" />
                <SkeletonLine className="h-4 w-28" />
                <SkeletonLine className="h-4 w-20" />
              </div>
              <SkeletonLine className="h-7 w-16" />
            </div>
            <div className="mt-3 space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-4 w-28" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <SkeletonLine className="h-4 w-10" />
              <SkeletonLine className="h-5 w-14" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[1.6fr_1fr_1.4fr_1.4fr_1fr_0.8fr_0.8fr] gap-3 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-300">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonLine key={index} className="h-4 w-16" />
          ))}
        </div>
        <div className="mt-2 grid gap-2">
          {Array.from({ length: 4 }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-[1.6fr_1fr_1.4fr_1.4fr_1fr_0.8fr_0.8fr] gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
            >
              <SkeletonLine className="h-5 w-full max-w-[14rem]" />
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-20" />
                <SkeletonLine className="h-3 w-14" />
              </div>
              <SkeletonLine className="h-4 w-full max-w-[10rem]" />
              <SkeletonLine className="h-4 w-full max-w-[10rem]" />
              <SkeletonLine className="h-4 w-20" />
              <SkeletonLine className="h-6 w-16" />
              <SkeletonLine className="ml-auto h-5 w-14" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="py-2">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <SkeletonLine className="h-8 w-24" />
          </div>
          <SkeletonLine className="h-11 w-40 rounded-full" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] xl:items-stretch">
        <div className="grid grid-cols-2 gap-3 xl:col-span-2 xl:h-full">
          <HealthMetricCardLoading />
          <HealthMetricCardLoading />
        </div>
        <div className="xl:col-start-3">
          <ResultsCardLoading />
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <RecentLiveBetsLoading />
        <JobsCardLoading />
      </section>

      <ResultsTableLoading />
    </main>
  );
}
