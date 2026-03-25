function SkeletonCard() {
  return (
    <div className="surface animate-pulse rounded-[26px] p-5">
      <div className="h-4 w-24 rounded-full bg-slate-200" />
      <div className="mt-4 h-10 w-32 rounded-2xl bg-slate-200" />
      <div className="mt-6 h-4 w-40 rounded-full bg-slate-200" />
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-6 lg:px-10 lg:py-10">
      <section className="surface animate-pulse rounded-[32px] px-6 py-8 sm:px-8">
        <div className="h-5 w-40 rounded-full bg-slate-200" />
        <div className="mt-5 h-12 w-full max-w-3xl rounded-[20px] bg-slate-200" />
        <div className="mt-4 h-5 w-full max-w-2xl rounded-full bg-slate-200" />
        <div className="mt-8 h-12 w-56 rounded-full bg-slate-200" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px]">
        <div className="grid gap-6">
          <div className="surface animate-pulse rounded-[28px] p-6">
            <div className="h-4 w-28 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-64 rounded-2xl bg-slate-200" />
            <div className="mt-6 h-36 rounded-[24px] bg-slate-200" />
          </div>
          <div className="surface animate-pulse rounded-[28px] p-6">
            <div className="h-4 w-28 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-72 rounded-2xl bg-slate-200" />
            <div className="mt-6 grid gap-3">
              <div className="h-24 rounded-[24px] bg-slate-200" />
              <div className="h-24 rounded-[24px] bg-slate-200" />
              <div className="h-24 rounded-[24px] bg-slate-200" />
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="surface animate-pulse rounded-[28px] p-6">
            <div className="h-4 w-28 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-56 rounded-2xl bg-slate-200" />
            <div className="mt-6 h-32 rounded-[24px] bg-slate-200" />
          </div>
          <div className="surface animate-pulse rounded-[28px] p-6">
            <div className="h-4 w-28 rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-56 rounded-2xl bg-slate-200" />
            <div className="mt-6 grid gap-3">
              <div className="h-20 rounded-[24px] bg-slate-200" />
              <div className="h-20 rounded-[24px] bg-slate-200" />
              <div className="h-20 rounded-[24px] bg-slate-200" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
