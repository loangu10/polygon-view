import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  Database,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import type {
  DashboardBreakdown,
  DashboardData,
  DashboardMetric,
  DashboardRange,
} from "@/lib/dashboard";
import { dashboardRanges } from "@/lib/dashboard";
import {
  cn,
  formatCompactNumber,
  formatCurrency,
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
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="surface rounded-[28px] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CompactBadge tone={data.mode === "live" ? "success" : "warning"}>
                {data.mode === "live" ? "Live" : "Demo"}
              </CompactBadge>
              <CompactBadge tone="neutral">
                Refresh {formatRelativeTime(data.updatedAt)}
              </CompactBadge>
              <CompactBadge tone="neutral">
                {formatCompactNumber(data.loadedCount)} rows loaded
              </CompactBadge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-3xl">
                Strategy performance
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Theoretical strategy analytics plus live bet tracking directly from
                `strategy_bet_performance`.
              </p>
            </div>
          </div>
          <RangeSwitcher activeRange={data.rangeDays} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <section className="surface rounded-[28px] p-5">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Recent live bets
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
              Latest live placement and result rows
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
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {bet.teamOne} vs {bet.teamTwo}
                      </p>
                      <p className="truncate text-sm text-slate-600">
                        {bet.strategy} / {bet.outcome}
                      </p>
                    </div>
                    <StatusBadge status={bet.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-900">
                      {formatValue(bet.pnl ?? bet.amount)}
                    </span>
                    <span>{formatRelativeTime(bet.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-4">
          <BreakdownCard
            icon={<ShieldCheck className="h-4 w-4" />}
            items={data.settlementBreakdown}
            subtitle="Theoretical strategy settlement mix for signal rows."
            title="Signal settlement mix"
          />
          <BreakdownCard
            icon={<Activity className="h-4 w-4" />}
            items={data.strategyBreakdown}
            subtitle="Signal volume per strategy with theoretical ROI context where available."
            title="Strategy mix"
          />
        </section>
      </section>

      <section className="surface rounded-[28px] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-2 sm:grid-cols-3">
            <MiniStat
              label="Source rows"
              value={
                data.totalCount === null
                  ? formatCompactNumber(data.loadedCount)
                  : formatCompactNumber(data.totalCount)
              }
            />
            <MiniStat
              label="Loaded slice"
              value={formatCompactNumber(data.loadedCount)}
            />
            <MiniStat
              label="Last refresh"
              value={formatRelativeTime(data.updatedAt)}
            />
          </div>
          <div
            className={cn(
              "flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs leading-5 lg:max-w-md",
              data.mode === "live"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                : "border-amber-200 bg-amber-50/90 text-amber-950",
            )}
          >
            {data.mode === "live" ? (
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <p>{data.notice}</p>
          </div>
        </div>
      </section>
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

function BreakdownCard({
  icon,
  items,
  subtitle,
  title,
}: {
  icon: React.ReactNode;
  items: DashboardBreakdown[];
  subtitle: string;
  title: string;
}) {
  return (
    <section className="surface rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Breakdown
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-slate-700">
          {icon}
        </div>
      </div>
      <div className="grid gap-2">
        {items.length === 0 ? (
          <EmptyState
            message="No rows were available for this breakdown in the selected window."
            title="No data"
          />
        ) : (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-950">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.helper}</p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  item.tone === "positive"
                    ? "text-emerald-700"
                    : item.tone === "negative"
                      ? "text-rose-700"
                      : "text-slate-900",
                )}
              >
                {formatCompactNumber(item.value)}
              </span>
            </div>
          ))
        )}
      </div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
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
    normalized === "won"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "lost"
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
