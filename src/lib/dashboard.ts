import {
  fetchSupabaseSlice,
  fetchSupabaseRows,
  hasSupabaseConfig,
} from "@/lib/supabase-rest";

export const dashboardRanges = [7, 30, 90] as const;

export type DashboardRange = (typeof dashboardRanges)[number];

export type DashboardMetric = {
  change: number | null;
  changeKind: "points" | "relative";
  context?: string;
  helper: string;
  id:
    | "actual-live-pnl"
    | "live-executions"
    | "portfolio-roi"
    | "realized-pnl"
    | "settled-win-rate"
    | "signal-count";
  label: string;
  type: "compact" | "currency" | "points";
  value: number;
};

export type DashboardRecentBet = {
  amount: number | null;
  errorMessage: string | null;
  eventEndAt: string | null;
  id: string;
  outcome: string;
  pnl: number | null;
  status: string;
  strategy: string;
  teamOne: string;
  teamTwo: string;
  updatedAt: string | null;
};

export type DashboardResultBet = {
  betAt: string | null;
  eventEndAt: string | null;
  id: string;
  matchLabel: string;
  pnl: number | null;
  resolvedOutcome: string | null;
  result: string;
  selection: string;
};

export type DashboardJobRun = {
  durationSeconds: number | null;
  id: string;
  placedCount: number;
  startedAt: string;
  status: string;
};

export type DashboardResultsSummary = {
  benefit: number | null;
  losses: number;
  pending: number;
  placedCount: number;
  pushes: number;
  settledCount: number;
  winRate: number;
  wins: number;
};

export type DashboardHealthChip = {
  count: number;
  detail: string;
  failedCount: number;
  label: string;
  status: "healthy" | "unhealthy";
};

export type DashboardData = {
  generatedAt: string;
  health: {
    jobs: DashboardHealthChip;
    liveBets: DashboardHealthChip;
  };
  latestRuns: DashboardJobRun[];
  loadedCount: number;
  metrics: DashboardMetric[];
  mode: "error" | "live";
  notice: string;
  recentResults: DashboardResultBet[];
  resultsSummary: DashboardResultsSummary;
  rangeDays: DashboardRange;
  recentBets: DashboardRecentBet[];
  totalCount: number | null;
  updatedAt: string | null;
};

type StrategyBetPerformanceRow = {
  actual_amount_usdc: number | string | null;
  actual_cost_usdc: number | string | null;
  actual_realized_roi: number | string | null;
  actual_realized_roi_estimated: number | string | null;
  actual_realized_pnl_estimated_usdc: number | string | null;
  actual_realized_pnl_usdc: number | string | null;
  collected_at_event: string | null;
  collected_at_poly: string | null;
  competition: string | null;
  edge_vs_gmean: number | string | null;
  event_end_time: string | null;
  fact_key: string;
  first_successful_attempted_at: string | null;
  is_bet_signal: boolean | null;
  live_bet_attempted: boolean | null;
  live_bet_lost_flag: number | boolean | null;
  live_bet_pending_flag: number | boolean | null;
  live_bet_placed: boolean | null;
  live_bet_placement_status: string | null;
  live_bet_push_flag: number | boolean | null;
  live_bet_result_status: string | null;
  live_bet_settled: boolean | null;
  live_bet_won_flag: number | boolean | null;
  last_execution_status: string | null;
  last_error_message: string | null;
  last_attempted_at: string | null;
  loss_flag: number | boolean | null;
  outcome_label: string | null;
  pending_flag: number | boolean | null;
  pm_team_1: string | null;
  pm_team_2: string | null;
  resolved_outcome_label: string | null;
  settled_at: string | null;
  signal_count: number | string | null;
  sport: string | null;
  settlement_status: string | null;
  strategy_name: string | null;
  strategy_threshold: number | string | null;
  theoretical_roi: number | string | null;
  theoretical_pnl_usdc: number | string | null;
  theoretical_stake_usdc: number | string | null;
  win_flag: number | boolean | null;
};

type SourceRunRow = {
  errors: unknown;
  id: string;
  meta: Record<string, unknown> | null;
  run_finished_at: string | null;
  run_started_at: string;
  status: string | null;
};

type DashboardSummary = {
  actualLivePnlSum: number | null;
  livePlacedCount: number;
  livePlacedStake: number;
  portfolioRoi: number | null;
  realizedPnlSum: number | null;
  settledDenominator: number;
  settledCount: number;
  signalCount: number;
  winRate: number;
  wins: number;
};

type DashboardQueryValue = boolean | number | string | null | undefined;

const DASHBOARD_PAGE_SIZE = 500;
const DASHBOARD_REVALIDATE_SECONDS = 45;
const RECENT_WINDOW_SCAN_LIMIT = 250;

const SUMMARY_SELECT =
  "fact_key,collected_at_poly,collected_at_event,is_bet_signal,signal_count,live_bet_placed,live_bet_won_flag,live_bet_lost_flag,live_bet_push_flag,live_bet_pending_flag,settlement_status,actual_amount_usdc,actual_cost_usdc,actual_realized_pnl_usdc,actual_realized_pnl_estimated_usdc,theoretical_stake_usdc,theoretical_pnl_usdc,win_flag";
const RECENT_BETS_SELECT =
  "fact_key,collected_at_poly,collected_at_event,event_end_time,strategy_name,outcome_label,pm_team_1,pm_team_2,live_bet_attempted,live_bet_placed,live_bet_placement_status,live_bet_result_status,live_bet_settled,last_error_message,actual_amount_usdc,actual_cost_usdc,actual_realized_pnl_usdc,actual_realized_pnl_estimated_usdc";
const RESULTS_SELECT =
  "fact_key,collected_at_poly,collected_at_event,event_end_time,settled_at,first_successful_attempted_at,pm_team_1,pm_team_2,outcome_label,resolved_outcome_label,live_bet_placed,live_bet_settled,live_bet_result_status,live_bet_won_flag,live_bet_lost_flag,live_bet_push_flag,actual_realized_pnl_usdc,actual_realized_pnl_estimated_usdc";
const HEALTH_LIVE_BETS_SELECT =
  "fact_key,collected_at_poly,collected_at_event,live_bet_attempted,live_bet_placed,live_bet_placement_status,last_execution_status,last_error_message,signal_count";

function clampRange(value: string | string[] | undefined): DashboardRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (dashboardRanges.includes(parsed as DashboardRange)) {
    return parsed as DashboardRange;
  }

  return 30;
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value: number | boolean | null | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  return value === 1;
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function relativeDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / previous) * 100;
}

function pointDelta(current: number, previous: number) {
  if (previous === 0 && current > 0) {
    return current;
  }

  return current - previous;
}

function isSignal(row: StrategyBetPerformanceRow) {
  return row.is_bet_signal === true;
}

function isSettled(row: StrategyBetPerformanceRow) {
  return ["lost", "push", "won"].includes((row.settlement_status ?? "").toLowerCase());
}

function getWindowTimestamp(row: StrategyBetPerformanceRow) {
  return row.collected_at_poly ?? row.collected_at_event;
}

function getLiveBetTimestamp(row: StrategyBetPerformanceRow) {
  return getWindowTimestamp(row);
}

function getLiveBetStatus(row: StrategyBetPerformanceRow) {
  return (
    (
      row.live_bet_settled
        ? row.live_bet_result_status
        : row.live_bet_placed
          ? row.live_bet_placement_status ?? "placed"
          : row.live_bet_attempted
            ? row.live_bet_placement_status ?? "attempted"
            : "unknown"
    )?.toLowerCase().replaceAll("_", " ") ?? "unknown"
  );
}

function getPnlValue(row: StrategyBetPerformanceRow) {
  return (
    toNullableNumber(row.theoretical_pnl_usdc) ??
    toNullableNumber(row.actual_realized_pnl_usdc) ??
    toNullableNumber(row.actual_realized_pnl_estimated_usdc)
  );
}

function getActualLivePnlValue(row: StrategyBetPerformanceRow) {
  return (
    toNullableNumber(row.actual_realized_pnl_usdc) ??
    toNullableNumber(row.actual_realized_pnl_estimated_usdc)
  );
}

function getStakeValue(row: StrategyBetPerformanceRow) {
  return (
    toNullableNumber(row.actual_cost_usdc) ??
    toNullableNumber(row.actual_amount_usdc) ??
    toNullableNumber(row.theoretical_stake_usdc)
  );
}

function isDuplicateLiveSkip(row: StrategyBetPerformanceRow) {
  return (row.last_error_message ?? "")
    .toLowerCase()
    .includes("skipped duplicate polymarket bet");
}

function buildWindowClause(
  column: "collected_at_event" | "collected_at_poly",
  start: string,
  end?: string,
  prefix: string[] = [],
) {
  const clauses = [...prefix, `${column}.gte.${start}`];

  if (end) {
    clauses.push(`${column}.lt.${end}`);
  }

  return `(${clauses.join(",")})`;
}

function byNewestWindowTimestamp(left: StrategyBetPerformanceRow, right: StrategyBetPerformanceRow) {
  return (
    new Date(getWindowTimestamp(right) ?? 0).getTime() -
    new Date(getWindowTimestamp(left) ?? 0).getTime()
  );
}

async function fetchStrategyWindowRows(
  start: string,
  options: {
    countMode?: false | "planned";
    end?: string;
    maxRows?: number;
    order?: string;
    pageSize?: number;
    query?: Record<string, DashboardQueryValue>;
    select: string;
  },
) {
  const baseQuery = {
    is_bet_signal: "eq.true",
    select: options.select,
    ...(options.order ? { order: options.order } : {}),
    ...(options.query ?? {}),
  };

  const [polyRows, eventRows] = await Promise.all([
    fetchSupabaseRows<StrategyBetPerformanceRow>(
      "strategy_bet_performance",
      {
        ...baseQuery,
        and: buildWindowClause("collected_at_poly", start, options.end, [
          "collected_at_poly.not.is.null",
        ]),
      },
      {
        countMode: options.countMode ?? false,
        maxRows: options.maxRows,
        pageSize: options.pageSize ?? DASHBOARD_PAGE_SIZE,
        revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
      },
    ),
    fetchSupabaseRows<StrategyBetPerformanceRow>(
      "strategy_bet_performance",
      {
        ...baseQuery,
        and: buildWindowClause("collected_at_event", start, options.end, [
          "collected_at_poly.is.null",
        ]),
      },
      {
        countMode: options.countMode ?? false,
        maxRows: options.maxRows,
        pageSize: options.pageSize ?? DASHBOARD_PAGE_SIZE,
        revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
      },
    ),
  ]);

  return [...polyRows, ...eventRows];
}

async function fetchLatestStrategyRows(options: {
  maxRows?: number;
  order?: string;
  pageSize?: number;
  query?: Record<string, DashboardQueryValue>;
  select: string;
}) {
  const baseQuery = {
    is_bet_signal: "eq.true",
    select: options.select,
    ...(options.order ? { order: options.order } : {}),
    ...(options.query ?? {}),
  };

  const [polyRows, eventRows] = await Promise.all([
    fetchSupabaseRows<StrategyBetPerformanceRow>(
      "strategy_bet_performance",
      {
        ...baseQuery,
        and: "(collected_at_poly.not.is.null)",
      },
      {
        maxRows: options.maxRows,
        pageSize: options.pageSize ?? DASHBOARD_PAGE_SIZE,
        revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
      },
    ),
    fetchSupabaseRows<StrategyBetPerformanceRow>(
      "strategy_bet_performance",
      {
        ...baseQuery,
        and: "(collected_at_poly.is.null,collected_at_event.not.is.null)",
      },
      {
        maxRows: options.maxRows,
        pageSize: options.pageSize ?? DASHBOARD_PAGE_SIZE,
        revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
      },
    ),
  ]);

  return [...polyRows, ...eventRows];
}

function getLiveBetErrorMessage(row: StrategyBetPerformanceRow) {
  if (getLiveBetStatus(row) !== "attempt failed" || !row.last_error_message) {
    return null;
  }

  const extractedMessage = row.last_error_message.match(/'error': '([^']+)'/i)?.[1];
  const message = extractedMessage ?? row.last_error_message;

  if (message.length <= 140) {
    return message;
  }

  return `${message.slice(0, 137)}...`;
}

function getLiveResultState(row: StrategyBetPerformanceRow) {
  const status = (row.live_bet_result_status ?? "").toLowerCase();

  if (status === "won" || status === "lost" || status === "push") {
    return status;
  }

  if (toNullableNumber(row.live_bet_won_flag as number | string | null) ?? 0) {
    return "won";
  }

  if (toNullableNumber(row.live_bet_lost_flag as number | string | null) ?? 0) {
    return "lost";
  }

  if (toNullableNumber(row.live_bet_push_flag as number | string | null) ?? 0) {
    return "push";
  }

  return null;
}

function getSummary(rows: StrategyBetPerformanceRow[]): DashboardSummary {
  const signalRows = rows.filter(isSignal);
  const visibleLiveRows = signalRows.filter(
    (row) => row.live_bet_placed === true || !isDuplicateLiveSkip(row),
  );
  const settledRows = signalRows.filter(isSettled);
  const wins = signalRows.reduce(
    (total, row) => total + (toBoolean(row.win_flag) ? toNullableNumber(row.signal_count) ?? 1 : 0),
    0,
  );
  const settledDenominator = settledRows.reduce(
    (total, row) => total + (toNullableNumber(row.signal_count) ?? 0),
    0,
  );
  const pnlValues = signalRows
    .map(getPnlValue)
    .filter((value): value is number => value !== null);
  const actualLivePnlValues = visibleLiveRows
    .filter((row) => row.live_bet_placed === true)
    .map(getActualLivePnlValue)
    .filter((value): value is number => value !== null);
  const totalStake = signalRows.reduce(
    (total, row) => total + (toNullableNumber(row.theoretical_stake_usdc) ?? 0),
    0,
  );
  const livePlacedStake = visibleLiveRows.reduce(
    (total, row) =>
      total + (row.live_bet_placed === true ? getStakeValue(row) ?? 0 : 0),
    0,
  );
  const totalTheoreticalPnl = signalRows.reduce(
    (total, row) => total + (toNullableNumber(row.theoretical_pnl_usdc) ?? 0),
    0,
  );

  return {
    actualLivePnlSum:
      actualLivePnlValues.length === 0
        ? null
        : actualLivePnlValues.reduce((total, value) => total + value, 0),
    livePlacedCount: visibleLiveRows.reduce(
      (total, row) => total + (row.live_bet_placed === true ? toNullableNumber(row.signal_count) ?? 1 : 0),
      0,
    ),
    livePlacedStake,
    portfolioRoi: totalStake === 0 ? null : (totalTheoreticalPnl / totalStake) * 100,
    realizedPnlSum:
      pnlValues.length === 0
        ? null
        : pnlValues.reduce((total, value) => total + value, 0),
    settledDenominator,
    settledCount: settledRows.length,
    signalCount: signalRows.reduce(
      (total, row) => total + (toNullableNumber(row.signal_count) ?? 0),
      0,
    ),
    winRate: settledDenominator === 0 ? 0 : (wins / settledDenominator) * 100,
    wins,
  };
}

function getResultsSummary(rows: StrategyBetPerformanceRow[]): DashboardResultsSummary {
  const placedRows = rows.filter((row) => row.live_bet_placed === true);
  const wins = placedRows.reduce(
    (total, row) => total + (toNullableNumber(row.live_bet_won_flag as number | string | null) ?? 0),
    0,
  );
  const losses = placedRows.reduce(
    (total, row) => total + (toNullableNumber(row.live_bet_lost_flag as number | string | null) ?? 0),
    0,
  );
  const pushes = placedRows.reduce(
    (total, row) => total + (toNullableNumber(row.live_bet_push_flag as number | string | null) ?? 0),
    0,
  );
  const pending = placedRows.reduce(
    (total, row) => total + (toNullableNumber(row.live_bet_pending_flag as number | string | null) ?? 0),
    0,
  );
  const settledCount = wins + losses + pushes;
  const pnlValues = placedRows
    .map(getActualLivePnlValue)
    .filter((value): value is number => value !== null);

  return {
    benefit:
      pnlValues.length === 0
        ? null
        : pnlValues.reduce((total, value) => total + value, 0),
    losses,
    pending,
    placedCount: placedRows.reduce(
      (total, row) => total + (toNullableNumber(row.signal_count) ?? 1),
      0,
    ),
    pushes,
    settledCount,
    winRate: settledCount === 0 ? 0 : (wins / settledCount) * 100,
    wins,
  };
}

function buildSamplingNotice(loadedCount: number, totalCount: number | null) {
  if (totalCount !== null && totalCount > loadedCount) {
    return `Analytics use ${loadedCount.toLocaleString("en-US")} signal rows in the selected window and ${totalCount.toLocaleString("en-US")} signal rows across the current plus previous comparison windows.`;
  }

  return "Analytics are loaded directly from strategy_bet_performance through Supabase REST using collected_at_poly/collected_at_event.";
}

function buildMetrics(
  rangeDays: DashboardRange,
  currentRows: StrategyBetPerformanceRow[],
  previousRows: StrategyBetPerformanceRow[],
): DashboardMetric[] {
  const current = getSummary(currentRows);
  const previous = getSummary(previousRows);
  const currentResults = getResultsSummary(currentRows);
  const previousResults = getResultsSummary(previousRows);
  const helper = `vs prev. ${rangeDays}d`;

  const metrics: DashboardMetric[] = [
    {
      change: relativeDelta(current.signalCount, previous.signalCount),
      changeKind: "relative",
      helper,
      id: "signal-count",
      label: "Signals",
      type: "compact",
      value: current.signalCount,
    },
    {
      change: pointDelta(currentResults.winRate, previousResults.winRate),
      changeKind: "points",
      helper,
      id: "settled-win-rate",
      label: "Settled win rate",
      type: "points",
      value: currentResults.winRate,
    },
  ];

  if (current.realizedPnlSum !== null || previous.realizedPnlSum !== null) {
    metrics.push({
      change: relativeDelta(current.realizedPnlSum ?? 0, previous.realizedPnlSum ?? 0),
      changeKind: "relative",
      helper,
      id: "realized-pnl",
      label: "Theoretical PnL",
      type: "currency",
      value: current.realizedPnlSum ?? 0,
    });
  } else {
    metrics.push({
      change: relativeDelta(current.livePlacedCount, previous.livePlacedCount),
      changeKind: "relative",
      context: `($${current.livePlacedStake.toFixed(0)})`,
      helper,
      id: "live-executions",
      label: "Live bets placed",
      type: "compact",
      value: current.livePlacedCount,
    });
  }

  if (current.portfolioRoi !== null || previous.portfolioRoi !== null) {
    metrics.push({
      change: pointDelta(current.portfolioRoi ?? 0, previous.portfolioRoi ?? 0),
      changeKind: "points",
      helper,
      id: "portfolio-roi",
      label: "Portfolio ROI",
      type: "points",
      value: current.portfolioRoi ?? 0,
    });
  } else if (current.actualLivePnlSum !== null || previous.actualLivePnlSum !== null) {
    metrics.push({
      change: relativeDelta(current.actualLivePnlSum ?? 0, previous.actualLivePnlSum ?? 0),
      changeKind: "relative",
      helper,
      id: "actual-live-pnl",
      label: "Actual live PnL",
      type: "currency",
      value: current.actualLivePnlSum ?? 0,
    });
  }

  return metrics;
}

function getRunDurationSeconds(run: SourceRunRow) {
  const metaDuration = run.meta?.duration_seconds;

  if (typeof metaDuration === "number" && Number.isFinite(metaDuration)) {
    return metaDuration;
  }

  if (!run.run_finished_at) {
    return null;
  }

  return (
    new Date(run.run_finished_at).getTime() - new Date(run.run_started_at).getTime()
  ) / 1000;
}

async function fetchPlacedCountsByRun(sourceRuns: SourceRunRow[]) {
  const runStarts = sourceRuns.map((run) => run.run_started_at).filter(Boolean);

  if (runStarts.length === 0) {
    return new Map<string, number>();
  }

  const rows = await fetchSupabaseRows<StrategyBetPerformanceRow>(
    "strategy_bet_performance",
    {
      live_bet_placed: "eq.true",
      or: `(${runStarts.map((runStartedAt) => `collected_at_event.eq.${runStartedAt}`).join(",")})`,
      select: "collected_at_event,signal_count",
    },
    {
      pageSize: 250,
      revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
    },
  );

  return rows.reduce((counts, row) => {
    if (!row.collected_at_event) {
      return counts;
    }

    const nextCount = (counts.get(row.collected_at_event) ?? 0) + (toNullableNumber(row.signal_count) ?? 1);
    counts.set(row.collected_at_event, nextCount);
    return counts;
  }, new Map<string, number>());
}

function buildLatestRuns(
  placedCounts: Map<string, number>,
  sourceRuns: SourceRunRow[],
): DashboardJobRun[] {
  return sourceRuns.map((run) => ({
    durationSeconds: getRunDurationSeconds(run),
    id: run.id,
    placedCount: placedCounts.get(run.run_started_at) ?? 0,
    startedAt: run.run_started_at,
    status: (run.status ?? "unknown").toLowerCase(),
  }));
}

function buildRecentBets(rows: StrategyBetPerformanceRow[]) {
  return rows
    .filter(
      (row) =>
        row.live_bet_placed === true ||
        (row.live_bet_attempted === true && !isDuplicateLiveSkip(row)),
    )
    .sort((left, right) => {
      return (
        new Date(getLiveBetTimestamp(right) ?? 0).getTime() -
        new Date(getLiveBetTimestamp(left) ?? 0).getTime()
      );
    })
    .slice(0, 5)
    .map((row) => {
      const status = getLiveBetStatus(row);

      return {
        amount: getStakeValue(row),
        errorMessage: getLiveBetErrorMessage(row),
        eventEndAt: row.event_end_time,
        id: row.fact_key,
        outcome: row.outcome_label ?? "Unknown outcome",
        pnl: getActualLivePnlValue(row),
        status,
        strategy: row.strategy_name ?? "unknown",
        teamOne: row.pm_team_1 ?? "Unknown",
        teamTwo: row.pm_team_2 ?? "Unknown",
        updatedAt: getLiveBetTimestamp(row),
      };
    });
}

function buildRecentResults(rows: StrategyBetPerformanceRow[]) {
  return rows
    .filter((row) => row.live_bet_placed === true && getLiveResultState(row) !== null)
    .sort((left, right) => {
      return (
        new Date(right.settled_at ?? right.event_end_time ?? 0).getTime() -
        new Date(left.settled_at ?? left.event_end_time ?? 0).getTime()
      );
    })
    .map((row) => ({
      betAt: row.first_successful_attempted_at ?? row.collected_at_poly ?? row.collected_at_event,
      eventEndAt: row.event_end_time ?? row.settled_at,
      id: row.fact_key,
      matchLabel: `${row.pm_team_1 ?? "Unknown"} vs ${row.pm_team_2 ?? "Unknown"}`,
      pnl: getActualLivePnlValue(row),
      resolvedOutcome: row.resolved_outcome_label,
      result: getLiveResultState(row) ?? "unknown",
      selection: row.outcome_label ?? "Unknown outcome",
    }));
}

function getLatestTimestamp(rows: StrategyBetPerformanceRow[]) {
  return rows.reduce<string | null>((latest, row) => {
    const timestamp = getWindowTimestamp(row);

    if (!timestamp) {
      return latest;
    }

    if (!latest || timestamp > latest) {
      return timestamp;
    }

    return latest;
  }, null);
}

function buildJobsHealth(runs: SourceRunRow[]): DashboardHealthChip {
  const failedCount = runs.filter((run) => {
    const status = (run.status ?? "unknown").toLowerCase();
    return status !== "success" || run.errors !== null;
  }).length;
  const status =
    runs.length >= 20 && failedCount === 0 ? "healthy" : "unhealthy";

  return {
    count: runs.length,
    detail:
      status === "healthy"
        ? `${runs.length} ok · 48h`
        : `${failedCount} fail · ${runs.length}/20 · 48h`,
    failedCount,
    label: "Jobs",
    status,
  };
}

function buildLiveBetsHealth(rows: StrategyBetPerformanceRow[]): DashboardHealthChip {
  const relevantRows = rows.filter(
    (row) =>
      row.live_bet_placed === true ||
      (row.live_bet_attempted === true && !isDuplicateLiveSkip(row)),
  );
  const placedCount = relevantRows.reduce(
    (total, row) => total + (row.live_bet_placed === true ? toNullableNumber(row.signal_count) ?? 1 : 0),
    0,
  );
  const failedCount = relevantRows.reduce((total, row) => {
    if (row.live_bet_placed === true) {
      return total;
    }

    const status = (row.live_bet_placement_status ?? "").toLowerCase();
    const executionStatus = (row.last_execution_status ?? "").toLowerCase();
    const isDuplicateSkipped = executionStatus === "duplicate_match_skipped";
    const isFailed =
      row.live_bet_attempted === true &&
      !isDuplicateSkipped &&
      (status.includes("fail") ||
        status.includes("error") ||
        status.includes("reject") ||
        status.includes("cancel"));

    return total + (isFailed ? toNullableNumber(row.signal_count) ?? 1 : 0);
  }, 0);
  const status =
    placedCount >= 1 && failedCount === 0 ? "healthy" : "unhealthy";

  return {
    count: placedCount,
    detail:
      status === "healthy"
        ? `${placedCount} ok · 48h`
        : `${failedCount} fail · ${placedCount} placed · 48h`,
    failedCount,
    label: "Live bets",
    status,
  };
}

async function loadQuery<T>(label: string, operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`${label}: ${error.message}`);
    }

    throw new Error(`${label}: ${String(error)}`);
  }
}

function buildErrorData(rangeDays: DashboardRange, notice: string): DashboardData {
  return {
    generatedAt: new Date().toISOString(),
    health: {
      jobs: {
        count: 0,
        detail: "No data",
        failedCount: 0,
        label: "Jobs",
        status: "unhealthy",
      },
      liveBets: {
        count: 0,
        detail: "No data",
        failedCount: 0,
        label: "Live bets",
        status: "unhealthy",
      },
    },
    latestRuns: [],
    loadedCount: 0,
    metrics: [],
    mode: "error",
    notice,
    recentResults: [],
    resultsSummary: {
      benefit: null,
      losses: 0,
      pending: 0,
      placedCount: 0,
      pushes: 0,
      settledCount: 0,
      winRate: 0,
      wins: 0,
    },
    rangeDays,
    recentBets: [],
    totalCount: null,
    updatedAt: null,
  };
}

export function getRangeFromSearch(value: string | string[] | undefined) {
  return clampRange(value);
}

export async function getDashboardData(rangeDays: DashboardRange): Promise<DashboardData> {
  if (!hasSupabaseConfig()) {
    return buildErrorData(
      rangeDays,
      "Database connection is not configured. Missing SUPABASE_REST_URL or SUPABASE_API_KEY.",
    );
  }

  const now = new Date();
  const healthStart = subtractDays(now, 2).toISOString();
  const comparisonStart = subtractDays(now, rangeDays * 2).toISOString();
  const currentStart = subtractDays(now, rangeDays).toISOString();

  try {
    const currentRows = await loadQuery("Current summary window query", () =>
      fetchStrategyWindowRows(currentStart, {
        select: SUMMARY_SELECT,
      }),
    );

    const previousRows = await loadQuery("Previous summary window query", () =>
      fetchStrategyWindowRows(comparisonStart, {
        end: currentStart,
        select: SUMMARY_SELECT,
      }),
    );

    const [recentLiveRows, resultRows, sourceRunsPage, healthRuns, healthLiveBetRows] = await Promise.all([
      loadQuery("Recent live bets query", () =>
        fetchLatestStrategyRows({
          maxRows: RECENT_WINDOW_SCAN_LIMIT,
          order: "collected_at_poly.desc.nullslast,collected_at_event.desc.nullslast",
          pageSize: 250,
          select: RECENT_BETS_SELECT,
        }),
      ),
      loadQuery("Settled results query", () =>
        fetchStrategyWindowRows(currentStart, {
          query: {
            live_bet_placed: "eq.true",
            live_bet_settled: "eq.true",
          },
          select: RESULTS_SELECT,
        }),
      ),
      loadQuery("Recent source runs query", () =>
        fetchSupabaseSlice<SourceRunRow>("source_runs", {
          limit: 5,
          query: {
            order: "run_started_at.desc",
            select: "id,run_started_at,run_finished_at,status,meta,errors",
          },
          revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
        }),
      ),
      loadQuery("48h job health query", () =>
        fetchSupabaseRows<SourceRunRow>(
          "source_runs",
          {
            order: "run_started_at.desc",
            run_started_at: `gte.${healthStart}`,
            select: "id,run_started_at,run_finished_at,status,meta,errors",
          },
          {
            pageSize: 250,
            revalidateSeconds: DASHBOARD_REVALIDATE_SECONDS,
          },
        ),
      ),
      loadQuery("48h live bet health query", () =>
        fetchStrategyWindowRows(healthStart, {
          maxRows: 250,
          order: "collected_at_poly.desc.nullslast,collected_at_event.desc.nullslast",
          pageSize: 250,
          select: HEALTH_LIVE_BETS_SELECT,
        }),
      ),
    ]);

    const placedCountsByRun = await loadQuery("Placed bet counts by run query", () =>
      fetchPlacedCountsByRun(sourceRunsPage.data),
    );
    const updatedAt =
      getLatestTimestamp(currentRows) ??
      getLatestTimestamp(recentLiveRows) ??
      getLatestTimestamp(resultRows) ??
      getLatestTimestamp(previousRows);

    return {
      generatedAt: new Date().toISOString(),
      health: {
        jobs: buildJobsHealth(healthRuns),
        liveBets: buildLiveBetsHealth(healthLiveBetRows),
      },
      latestRuns: buildLatestRuns(placedCountsByRun, sourceRunsPage.data),
      loadedCount: currentRows.length,
      metrics: buildMetrics(rangeDays, currentRows, previousRows),
      mode: "live",
      notice: buildSamplingNotice(currentRows.length, currentRows.length + previousRows.length),
      recentResults: buildRecentResults(resultRows),
      resultsSummary: getResultsSummary(currentRows),
      rangeDays,
      recentBets: buildRecentBets(recentLiveRows.sort(byNewestWindowTimestamp)),
      totalCount: currentRows.length + previousRows.length,
      updatedAt,
    };
  } catch (error) {
    console.error("Failed to load dashboard data from strategy_bet_performance", error);

    return buildErrorData(
      rangeDays,
      error instanceof Error
        ? `Database connection failed: ${error.message}`
        : `Database connection failed: ${String(error)}`,
    );
  }
}
