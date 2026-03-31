"use client";

import { useEffect, useState } from "react";
import { Bot, Clock3, ShieldCheck, TriangleAlert } from "lucide-react";

import type {
  DashboardData,
  DashboardHealthChip,
  DashboardJobRun,
  DashboardResultBet,
  DashboardResultsSummary,
} from "@/lib/dashboard";
import {
  ResultsCardLoading,
  ResultsTableLoading,
} from "@/components/dashboard/dashboard-loading";
import { LocalDateTime } from "@/components/time/local-date-time";
import { RangeSwitcher } from "@/components/dashboard/range-switcher";
import { type DashboardRange } from "@/lib/dashboard-range";
import {
  cn,
  formatCompactNumber,
  formatCurrency,
  formatDurationSeconds,
  formatPercent,
  formatRelativeTime,
} from "@/lib/format";

type DashboardViewProps = {
  data: DashboardData;
};

const headlineNumberClass = "text-xl font-semibold leading-none tracking-[-0.04em] text-slate-950";
const headlineCompanionClass = "text-xl font-semibold tracking-[-0.04em] text-slate-950";

export function DashboardView({ data }: DashboardViewProps) {
  const [pendingRange, setPendingRange] = useState<DashboardRange | null>(null);
  const isRangeRefreshing = pendingRange !== null && pendingRange !== data.rangeDays;

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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="py-2">
        <div className="flex items-center justify-between gap-3 lg:gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-3xl">
              Polygon
            </h1>
          </div>
          <div className="shrink-0">
            <RangeSwitcher
              activeRange={data.rangeDays}
              pendingRange={pendingRange}
              onRefreshError={() => setPendingRange(null)}
              onRefreshStart={setPendingRange}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)] xl:items-stretch">
        <div className="grid grid-cols-2 gap-3 xl:col-span-2 xl:h-full">
          <HealthMetricCard chip={data.health.jobs} />
          <HealthMetricCard chip={data.health.liveBets} />
        </div>
        <div className="h-full xl:col-start-3">
          {isRangeRefreshing ? (
            <ResultsCardLoading />
          ) : (
            <ResultsCard
              className="h-full"
              rangeDays={data.rangeDays}
              summary={data.resultsSummary}
            />
          )}
        </div>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="surface w-full overflow-hidden rounded-[28px] p-4 sm:p-5">
          <div className="mb-3">
            <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
              Pending live bets
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Showing {formatCompactNumber(data.recentBets.length)} pending bets in the selected period
            </p>
          </div>
          <div className="grid gap-1.5">
            {data.recentBets.length === 0 ? (
              <EmptyState
                message="No pending live bets were returned in the selected period."
                title="No pending live bets"
              />
            ) : (
              data.recentBets.map((bet) => (
                <div
                  key={bet.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
                >
                  <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:gap-3 sm:space-y-0">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold leading-5 text-slate-950 sm:truncate">
                        {bet.teamOne} vs {bet.teamTwo}
                      </p>
                      <p className="break-words text-sm leading-6 text-slate-600 sm:hidden">
                        <span>{bet.strategy}</span>
                        <span className="mx-1.5 text-slate-400">-</span>
                        <span>{bet.outcome}</span>
                        {shouldShowInlineBetAmount(bet.status) ? (
                          <>
                            <span className="mx-1.5 text-slate-400">-</span>
                            <span className="font-medium text-slate-900">
                              {formatValue(bet.pnl ?? bet.amount)}
                            </span>
                          </>
                        ) : null}
                        {bet.sharePrice !== null ? (
                          <>
                            <span className="mx-1.5 text-slate-400">-</span>
                            <span className="text-slate-500">
                              {formatCurrency(bet.sharePrice, 2)}/share
                            </span>
                          </>
                        ) : null}
                      </p>
                      <p className="text-sm leading-6 text-slate-500 sm:hidden">
                        PM {formatProbabilityValue(bet.pmProbability)}{" "}
                        <span className="mx-1.5 text-slate-400">-</span>
                        Books {formatProbabilityValue(bet.bookmakerProbability)}
                      </p>
                      <p className="hidden truncate text-sm leading-5 text-slate-600 sm:block">
                        <span>{bet.strategy}</span>
                        <span className="mx-1.5 text-slate-400">-</span>
                        <span>{bet.outcome}</span>
                        {shouldShowInlineBetAmount(bet.status) ? (
                          <>
                            <span className="mx-1.5 text-slate-400">-</span>
                            <span className="font-medium text-slate-900">
                              {formatValue(bet.pnl ?? bet.amount)}
                            </span>
                          </>
                        ) : null}
                        {bet.sharePrice !== null ? (
                          <>
                            <span className="mx-1.5 text-slate-400">-</span>
                            <span className="text-slate-500">
                              {formatCurrency(bet.sharePrice, 2)}/share
                            </span>
                          </>
                        ) : null}
                        <span className="mx-1.5 text-slate-400">-</span>
                        <span className="text-slate-500">
                          PM {formatProbabilityValue(bet.pmProbability)}
                        </span>
                        <span className="mx-1.5 text-slate-400">-</span>
                        <span className="text-slate-500">
                          Books {formatProbabilityValue(bet.bookmakerProbability)}
                        </span>
                      </p>
                      <p className="text-xs leading-5 text-slate-500">
                        {bet.eventEndAt ? (
                          <>
                            Ends <LocalDateTime emptyLabel="" value={bet.eventEndAt} />
                          </>
                        ) : (
                          "No end time"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:block sm:space-y-0.5 sm:text-right">
                      <div>
                        <StatusBadge
                          label={getLiveBetBadgeLabel(bet.amount, bet.status)}
                          showDot={false}
                          status={bet.status}
                        />
                      </div>
                      <p className="text-xs leading-5 text-slate-500">
                        {formatRelativeTime(bet.updatedAt)}
                      </p>
                    </div>
                  </div>
                  {bet.errorMessage ? (
                    <div className="mt-1.5 flex items-start gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-2.5 py-1.5 text-[11px] text-rose-800">
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                      <p className="line-clamp-1">{bet.errorMessage}</p>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <JobsCard runs={data.latestRuns} />
      </section>

      {isRangeRefreshing ? (
        <ResultsTableLoading />
      ) : (
        <ResultsTable rangeDays={data.rangeDays} results={data.recentResults} />
      )}
    </main>
  );
}

function ResultsCard({
  className,
  rangeDays,
  summary,
}: {
  className?: string;
  rangeDays: DashboardRange;
  summary: DashboardResultsSummary;
}) {
  const realizedPnl = Number.isFinite(summary.realizedPnl) ? summary.realizedPnl : null;
  const realizedPnlTone =
    realizedPnl === null
      ? "text-slate-900"
      : realizedPnl > 0
        ? "text-emerald-700"
        : realizedPnl < 0
          ? "text-rose-700"
          : "text-slate-900";

  return (
    <section
      className={cn("surface flex h-full w-full flex-col overflow-hidden rounded-[28px] p-4 sm:p-5", className)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
            Results
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Placed in past {rangeDays}d. Win rate and PnL use settled bets only.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 text-slate-700">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <p className={headlineNumberClass}>
            {formatPercent(summary.winRate)}
          </p>
          <p className="text-sm text-slate-500">
            <span className={headlineCompanionClass}>win rate</span>{" "}
            <span className="text-slate-400">
              ({formatCompactNumber(summary.wins)}W, {formatCompactNumber(summary.losses)}L
              {summary.pushes > 0 ? `, ${formatCompactNumber(summary.pushes)}P` : ""})
            </span>
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CompactResultStat
          label="Placed"
          value={formatCompactNumber(summary.placedCount)}
        />
        <CompactResultStat
          label="Settled"
          value={formatCompactNumber(summary.settledCount)}
        />
        <CompactResultStat
          label="Pending"
          value={formatCompactNumber(summary.pending)}
          detail={
            summary.pendingStake > 0 ? `${formatCurrency(summary.pendingStake, 2)} open stake` : undefined
          }
        />
        <CompactResultStat
          label="Realized"
          tone={realizedPnlTone}
          value={
            realizedPnl === null ? "No PnL yet" : formatCurrency(realizedPnl, 2)
          }
        />
      </div>
    </section>
  );
}

function JobsCard({ runs }: { runs: DashboardJobRun[] }) {
  return (
    <section className="surface w-full overflow-hidden rounded-[28px] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
            Jobs
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            5 latest runs
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
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
                  <LocalDateTime value={run.startedAt} />
                </p>
                <StatusBadge status={run.status} />
              </div>
              <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span>{formatDurationSeconds(run.durationSeconds)}</span>
                <span>
                  {formatCompactNumber(run.placedCount)} placed ·{" "}
                  {formatCompactNumber(run.analyzedCount)} analyzed
                </span>
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
  const [oddsById, setOddsById] = useState<
    Record<string, { bookmakerProbability: number | null; pmProbability: number | null }>
  >({});

  useEffect(() => {
    const missingOddsIds = results
      .filter(
        (result) =>
          result.pmProbability === null ||
          result.bookmakerProbability === null,
      )
      .map((result) => result.id);
    const unresolvedOddsIds = missingOddsIds.filter((id) => !(id in oddsById));

    if (unresolvedOddsIds.length === 0) {
      return;
    }

    let isCancelled = false;

    void fetch("/api/result-odds", {
      body: JSON.stringify({ ids: unresolvedOddsIds }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const body = (await response.json().catch(() => null)) as {
          odds?: Array<{
            bookmakerProbability: number | null;
            id: string;
            pmProbability: number | null;
          }>;
        } | null;

        if (isCancelled || !body?.odds) {
          return;
        }

        const resolvedOdds = body.odds;

        setOddsById(
          (current) => {
            const next = { ...current };

            unresolvedOddsIds.forEach((id) => {
              next[id] ??= {
                bookmakerProbability: null,
                pmProbability: null,
              };
            });

            resolvedOdds.forEach((item) => {
              next[item.id] = {
                bookmakerProbability: item.bookmakerProbability,
                pmProbability: item.pmProbability,
              };
            });

            return next;
          },
        );
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [oddsById, results]);

  return (
    <section className="surface w-full overflow-hidden rounded-[28px] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
          Result bets
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Settled bets over past {rangeDays}d. Times show successful placement and final settlement.
        </p>
      </div>
      {results.length === 0 ? (
        <EmptyState
          message="No settled live bets were returned for the selected period yet."
          title="No settled results"
        />
      ) : (
        <>
          <div className="grid gap-2 md:hidden">
            {results.map((result) => {
              const mergedOdds = oddsById[result.id];
              const pmProbability = mergedOdds?.pmProbability ?? result.pmProbability;
              const bookmakerProbability =
                mergedOdds?.bookmakerProbability ?? result.bookmakerProbability;

              return (
                <div
                  key={result.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        {result.matchLabel}
                      </p>
                      <p className="text-sm text-slate-600">{result.selection}</p>
                      {result.sharePrice !== null ? (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatCurrency(result.sharePrice, 2)}/share
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">
                        PM {formatProbabilityValue(pmProbability)} · Books{" "}
                        {formatProbabilityValue(bookmakerProbability)}
                      </p>
                    </div>
                    <StatusBadge status={result.result} />
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-slate-500">
                    <p>Placed at <LocalDateTime value={result.betAt} /></p>
                    <p>Settled at <LocalDateTime value={result.finishedAt} /></p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">P&amp;L</span>
                    <div className="text-right">
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
                      {result.pnl !== null && result.pnlIsEstimated ? (
                        <p className="text-[11px] text-slate-500">Estimated</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-3 py-1 font-medium">Match</th>
                <th className="px-3 py-1 font-medium">Bet</th>
                <th className="px-3 py-1 font-medium">Placed at</th>
                <th className="px-3 py-1 font-medium">Settled at</th>
                <th className="px-3 py-1 font-medium">Odds</th>
                <th className="px-3 py-1 font-medium">Win/Loss</th>
                <th className="px-3 py-1 text-right font-medium">P&amp;L</th>
              </tr>
            </thead>
              <tbody>
                {results.map((result) => {
                  const mergedOdds = oddsById[result.id];
                  const pmProbability = mergedOdds?.pmProbability ?? result.pmProbability;
                  const bookmakerProbability =
                    mergedOdds?.bookmakerProbability ?? result.bookmakerProbability;

                  return (
                    <tr
                      key={result.id}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 text-sm text-slate-700"
                    >
                      <td className="rounded-l-2xl px-3 py-3 font-medium text-slate-950">
                        {result.matchLabel}
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p>{result.selection}</p>
                          {result.sharePrice !== null ? (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatCurrency(result.sharePrice, 2)}/share
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        <LocalDateTime value={result.betAt} />
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        <LocalDateTime value={result.finishedAt} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs leading-5 text-slate-500">
                          <p>PM {formatProbabilityValue(pmProbability)}</p>
                          <p>Books {formatProbabilityValue(bookmakerProbability)}</p>
                        </div>
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
                        <div>
                          <p>{result.pnl === null ? "No PnL yet" : formatCurrency(result.pnl, 2)}</p>
                          {result.pnl !== null && result.pnlIsEstimated ? (
                            <p className="mt-0.5 text-[11px] font-normal text-slate-500">Estimated</p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function formatValue(value: number | null) {
  if (value === null) {
    return "No PnL yet";
  }

  return formatCurrency(value);
}

function formatProbabilityValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "No data";
  }

  return value.toFixed(2);
}

function CompactResultStat({
  detail,
  label,
  tone,
  value,
}: {
  detail?: string;
  label: string;
  tone?: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
      <p className="truncate text-[11px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold", tone ?? "text-slate-950")}>{value}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p> : null}
    </div>
  );
}

function HealthMetricCard({ chip }: { chip: DashboardHealthChip }) {
  const badgeStyles =
    chip.status === "healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";
  const accentColor = chip.status === "healthy" ? "text-emerald-700" : "text-rose-700";
  const primaryCount = formatCompactNumber(chip.count);
  const primarySuffix = chip.label === "Jobs" ? "runs" : "placed";
  const secondaryValue =
    chip.failedCount === 0
      ? "0 failed"
      : `${formatCompactNumber(chip.failedCount)} failed`;

  return (
    <article className="surface flex h-full flex-col rounded-[24px] p-4">
      <div>
        <h2 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
          {chip.label} health
        </h2>
        <span
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
            badgeStyles,
          )}
        >
          {chip.status}
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <p className="flex items-baseline gap-1.5 text-slate-950">
          <span className={headlineNumberClass}>{primaryCount}</span>
          <span className={headlineCompanionClass}>
            {primarySuffix}
          </span>
        </p>
        <span className="hidden text-[11px] uppercase tracking-[0.14em] text-slate-400 sm:inline">
          in last 48h
        </span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400 sm:hidden">
        in last 48h
      </p>
      <p className={cn("mt-1 text-sm font-medium", accentColor)}>
        {secondaryValue}
      </p>
      <p className="mt-1 text-xs text-slate-500">{chip.averageLabel}</p>
      <div className="flex-1" />
    </article>
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

function getLiveBetBadgeLabel(amount: number | null, status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "placed" && amount !== null) {
    return `${formatCurrency(amount, 0)} Placed`;
  }

  return status;
}

function shouldShowInlineBetAmount(status: string) {
  return status.toLowerCase() !== "placed";
}

function StatusBadge({
  label,
  showDot = false,
  status,
}: {
  label?: string;
  showDot?: boolean;
  status: string;
}) {
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
      {showDot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {label ?? status}
    </span>
  );
}
