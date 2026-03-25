import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type {
  DashboardData,
  DashboardJobRun,
  DashboardMetric,
  DashboardRange,
  DashboardResultBet,
  DashboardResultsSummary,
} from "@/lib/dashboard";
import { LocalDateTime } from "@/components/time/local-date-time";
import { dashboardRanges } from "@/lib/dashboard";
import {
  cn,
  formatCompactNumber,
  formatCurrency,
  formatDurationSeconds,
  formatPercent,
  formatRelativeTime,
  formatSignedPercent,
  formatSignedPoints,
} from "@/lib/format";

type DashboardViewProps = {
  data: DashboardData;
};

const metricIcons = {
  "actual-live-pnl": CircleDollarSign,
  "live-executions": Activity,
  "portfolio-roi": ShieldCheck,
  "realized-pnl": CircleDollarSign,
  "settled-win-rate": ShieldCheck,
  "signal-count": ArrowUpRight,
} as const;

export function DashboardView({ data }: DashboardViewProps) {
  if (data.mode === "error") {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        <section className="surface rounded-[28px] p-6 sm:p-7">
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">
              Connection error
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              Dashboard unavailable
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">{data.notice}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
      <section className="surface rounded-[28px] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CompactBadge tone="success">Live</CompactBadge>
              <CompactBadge tone="neutral">
                Latest snapshot {formatRelativeTime(data.updatedAt)}
              </CompactBadge>
              <CompactBadge tone="neutral">
                {formatCompactNumber(data.loadedCount)} signal rows analyzed
              </CompactBadge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-3xl">
                Polygon
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Theoretical strategy analytics and live bet tracking based on
                collected market snapshots from `strategy_bet_performance`.
              </p>
            </div>
          </div>
          <RangeSwitcher activeRange={data.rangeDays} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <section className="surface rounded-[28px] p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recent live bets
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
              Latest live bet rows by collected snapshot time
            </h2>
          </div>
          <div className="grid gap-2">
            {data.recentBets.length === 0 ? (
              <EmptyState
                message="No live bet attempts or placements were returned in the selected period."
                title="No recent live bets"
              />
            ) : (
              data.recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-5 text-slate-950 sm:truncate">
                        {bet.teamOne} vs {bet.teamTwo}
                      </p>
                      <p className="text-sm text-slate-600 sm:truncate">
                        {bet.strategy} / {bet.outcome}
                      </p>
                    </div>
                    <div className="self-start sm:self-auto">
                      <StatusBadge status={bet.status} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="font-medium text-slate-900">
                      {formatValue(bet.pnl ?? bet.amount)}
                    </span>
                    <span>{formatRelativeTime(bet.updatedAt)}</span>
                  </div>
                  {bet.eventEndAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Ends <LocalDateTime emptyLabel="" value={bet.eventEndAt} />
                    </p>
                  ) : null}
                  {bet.errorMessage ? (
                    <div className="mt-2 flex items-start gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-xs text-rose-800">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>{bet.errorMessage}</p>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-3">
          <ResultsCard rangeDays={data.rangeDays} summary={data.resultsSummary} />
          <JobsCard runs={data.latestRuns} />
        </section>
      </section>

      <ResultsTable rangeDays={data.rangeDays} results={data.recentResults} />
    </main>
  );
}

function RangeSwitcher({ activeRange }: { activeRange: DashboardRange }) {
  return (
    <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 p-1 backdrop-blur">
      {dashboardRanges.map((range) => (
        <Link
          key={range}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            activeRange === range
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          )}
          href={`/?range=${range}`}
        >
          {range}d
        </Link>
      ))}
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metricIcons[metric.id];

  return (
    <article className="surface rounded-[24px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            {formatMetricValue(metric)}
          </p>
          {metric.context ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              {metric.context}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p
          className={cn(
            "text-sm font-medium",
            metric.change !== null && metric.change < 0
              ? "text-rose-600"
              : "text-emerald-600",
          )}
        >
          {metric.changeKind === "points"
            ? formatSignedPoints(metric.change)
            : formatSignedPercent(metric.change)}
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {metric.helper}
        </p>
      </div>
    </article>
  );
}

function ResultsCard({
  rangeDays,
  summary,
}: {
  rangeDays: DashboardRange;
  summary: DashboardResultsSummary;
}) {
  const benefitTone =
    summary.benefit === null
      ? "text-slate-900"
      : summary.benefit > 0
        ? "text-emerald-700"
        : summary.benefit < 0
          ? "text-rose-700"
          : "text-slate-900";

  return (
    <section className="surface rounded-[28px] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Results
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-950">
            Range win rate
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Live placed bets in the selected {rangeDays} day window.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 text-slate-700">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <p className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            {formatPercent(summary.winRate)}
          </p>
          <p className="text-xs text-slate-500">
            {formatCompactNumber(summary.wins)} won, {formatCompactNumber(summary.losses)} lost
            {summary.pushes > 0 ? `, ${formatCompactNumber(summary.pushes)} push` : ""}
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <MiniStat
          label="Placed bets"
          value={formatCompactNumber(summary.placedCount)}
        />
        <MiniStat
          label="Settled bets"
          value={formatCompactNumber(summary.settledCount)}
        />
        <MiniStat
          label="Pending bets"
          value={formatCompactNumber(summary.pending)}
        />
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Benefit</p>
          <p className={cn("mt-1 text-sm font-semibold", benefitTone)}>
            {summary.benefit === null ? "No PnL yet" : formatCurrency(summary.benefit, 2)}
          </p>
        </div>
      </div>
    </section>
  );
}

function JobsCard({ runs }: { runs: DashboardJobRun[] }) {
  return (
    <section className="surface rounded-[28px] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Jobs
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-slate-950">
            Last 5 runs
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Latest `source_runs` with placed bets matched by run snapshot time.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 text-slate-700">
          <Clock3 className="h-4 w-4" />
        </div>
      </div>
      <div className="grid gap-1.5">
        {runs.length === 0 ? (
          <EmptyState
            message="No recent source runs were returned."
            title="No jobs"
          />
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
                  <LocalDateTime value={run.startedAt} />
                </p>
                <StatusBadge status={run.status} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{formatDurationSeconds(run.durationSeconds)}</span>
                <span>{formatCompactNumber(run.placedCount)} placed</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ResultsTable({
  rangeDays,
  results,
}: {
  rangeDays: DashboardRange;
  results: DashboardResultBet[];
}) {
  return (
    <section className="surface rounded-[28px] p-5">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Result bets
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
          Results in the selected {rangeDays} day window.
        </h2>
      </div>
      {results.length === 0 ? (
        <EmptyState
          message="No settled live bets were returned for the selected period yet."
          title="No settled results"
        />
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {results.map((result) => (
              <div
                key={result.id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      {result.matchLabel}
                    </p>
                    <p className="text-sm text-slate-600">{result.selection}</p>
                  </div>
                  <StatusBadge status={result.result} />
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate-500">
                  <p>Bet at <LocalDateTime value={result.betAt} /></p>
                  <p>Finished <LocalDateTime value={result.eventEndAt} /></p>
                  <p>Best result {result.resolvedOutcome ?? "No result yet"}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-500">P&amp;L</span>
                  <span
                    className={cn(
                      "font-semibold",
                      result.pnl === null
                        ? "text-slate-900"
                        : result.pnl > 0
                          ? "text-emerald-700"
                          : result.pnl < 0
                            ? "text-rose-700"
                            : "text-slate-900",
                    )}
                  >
                    {result.pnl === null ? "No PnL yet" : formatCurrency(result.pnl, 2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3 py-1 font-medium">Match</th>
                <th className="px-3 py-1 font-medium">Bet</th>
                <th className="px-3 py-1 font-medium">Bet at</th>
                <th className="px-3 py-1 font-medium">Finished</th>
                <th className="px-3 py-1 font-medium">Result</th>
                <th className="px-3 py-1 font-medium">Win/Loss</th>
                <th className="px-3 py-1 text-right font-medium">P&amp;L</th>
              </tr>
            </thead>
              <tbody>
                {results.map((result) => (
                  <tr
                    key={result.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 text-sm text-slate-700"
                  >
                    <td className="rounded-l-2xl px-3 py-3 font-medium text-slate-950">
                      {result.matchLabel}
                    </td>
                    <td className="px-3 py-3">{result.selection}</td>
                    <td className="px-3 py-3 text-slate-500">
                      <LocalDateTime value={result.betAt} />
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      <LocalDateTime value={result.eventEndAt} />
                    </td>
                    <td className="px-3 py-3">
                      {result.resolvedOutcome ?? "No result yet"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={result.result} />
                    </td>
                    <td
                      className={cn(
                        "rounded-r-2xl px-3 py-3 text-right font-semibold",
                        result.pnl === null
                          ? "text-slate-900"
                          : result.pnl > 0
                            ? "text-emerald-700"
                            : result.pnl < 0
                              ? "text-rose-700"
                              : "text-slate-900",
                      )}
                    >
                      {result.pnl === null ? "No PnL yet" : formatCurrency(result.pnl, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function formatMetricValue(metric: DashboardMetric) {
  if (metric.type === "currency") {
    return formatCurrency(metric.value);
  }

  if (metric.type === "points") {
    return formatPercent(metric.value);
  }

  return formatCompactNumber(metric.value);
}

function formatValue(value: number | null) {
  if (value === null) {
    return "No PnL yet";
  }

  return formatCurrency(value);
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CompactBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "neutral" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles,
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
        <Bot className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const styles =
    normalized === "placed" || normalized === "won" || normalized === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "attempt failed" ||
          normalized === "lost" ||
          normalized === "failed" ||
          normalized === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : normalized === "pending"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
        styles,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
