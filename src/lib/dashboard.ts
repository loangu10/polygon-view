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

export type DashboardData = {
  generatedAt: string;
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
  const helper = `vs previous ${rangeDays} days`;

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
      change: pointDelta(current.winRate, previous.winRate),
      changeKind: "points",
      helper,
      id: "settled-win-rate",
      label: "Settled win rate",
      type: "points",
      value: current.winRate,
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
      context: `$${current.livePlacedStake.toFixed(0)} placed`,
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

function buildLatestRuns(
  rows: StrategyBetPerformanceRow[],
  sourceRuns: SourceRunRow[],
): DashboardJobRun[] {
  return sourceRuns.map((run) => ({
    durationSeconds: getRunDurationSeconds(run),
    id: run.id,
    placedCount: rows.reduce(
      (total, row) =>
        total +
        (row.live_bet_placed === true && row.collected_at_event === run.run_started_at
          ? toNullableNumber(row.signal_count) ?? 1
          : 0),
      0,
    ),
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

function buildErrorData(rangeDays: DashboardRange, notice: string): DashboardData {
  return {
    generatedAt: new Date().toISOString(),
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
  const comparisonStart = subtractDays(now, rangeDays * 2).toISOString();
  const currentStart = subtractDays(now, rangeDays).toISOString();

  try {
    const [rows, sourceRunsPage] = await Promise.all([
      fetchSupabaseRows<StrategyBetPerformanceRow>("strategy_bet_performance", {
        is_bet_signal: "eq.true",
        order: "collected_at_poly.desc.nullslast,collected_at_event.desc.nullslast",
        or: `(collected_at_poly.gte.${comparisonStart},collected_at_event.gte.${comparisonStart})`,
        select:
          "fact_key,collected_at_poly,collected_at_event,event_end_time,settled_at,last_attempted_at,first_successful_attempted_at,strategy_name,strategy_threshold,sport,competition,is_bet_signal,signal_count,live_bet_attempted,live_bet_placed,live_bet_placement_status,live_bet_result_status,live_bet_settled,live_bet_won_flag,live_bet_lost_flag,live_bet_push_flag,live_bet_pending_flag,last_error_message,settlement_status,outcome_label,resolved_outcome_label,pm_team_1,pm_team_2,actual_amount_usdc,actual_cost_usdc,actual_realized_pnl_usdc,actual_realized_pnl_estimated_usdc,actual_realized_roi,actual_realized_roi_estimated,theoretical_stake_usdc,theoretical_pnl_usdc,theoretical_roi,edge_vs_gmean,win_flag,loss_flag,pending_flag",
      }),
      fetchSupabaseSlice<SourceRunRow>("source_runs", {
        limit: 5,
        query: {
          order: "run_started_at.desc",
          select: "id,run_started_at,run_finished_at,status,meta,errors",
        },
      }),
    ]);

    const currentRows = rows.filter(
      (row) => {
        const timestamp = getWindowTimestamp(row);
        return timestamp !== null && timestamp >= currentStart;
      },
    );
    const previousRows = rows.filter(
      (row) => {
        const timestamp = getWindowTimestamp(row);
        return (
          timestamp !== null &&
          timestamp < currentStart &&
          timestamp >= comparisonStart
        );
      },
    );
    const latestRows = currentRows.length > 0 ? currentRows : rows;
    const updatedAt = latestRows.reduce<string | null>((latest, row) => {
      const timestamp = getWindowTimestamp(row);
      if (!timestamp) {
        return latest;
      }

      if (!latest || timestamp > latest) {
        return timestamp;
      }

      return latest;
    }, null);

    return {
      generatedAt: new Date().toISOString(),
      latestRuns: buildLatestRuns(rows, sourceRunsPage.data),
      loadedCount: currentRows.length,
      metrics: buildMetrics(rangeDays, currentRows, previousRows),
      mode: "live",
      notice: buildSamplingNotice(currentRows.length, rows.length),
      recentResults: buildRecentResults(currentRows),
      resultsSummary: getResultsSummary(currentRows),
      rangeDays,
      recentBets: buildRecentBets(currentRows),
      totalCount: rows.length,
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
