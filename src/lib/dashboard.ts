import { fetchSupabaseSlice, hasSupabaseConfig } from "@/lib/supabase-rest";

export const dashboardRanges = [7, 30, 90] as const;

export type DashboardRange = (typeof dashboardRanges)[number];

export type DashboardMetric = {
  change: number | null;
  changeKind: "points" | "relative";
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

export type DashboardBreakdown = {
  helper: string;
  label: string;
  tone: "negative" | "neutral" | "positive";
  value: number;
};

export type DashboardRecentBet = {
  amount: number | null;
  id: string;
  outcome: string;
  pnl: number | null;
  status: string;
  strategy: string;
  teamOne: string;
  teamTwo: string;
  updatedAt: string | null;
};

export type DashboardData = {
  generatedAt: string;
  loadedCount: number;
  metrics: DashboardMetric[];
  mode: "demo" | "live";
  notice: string;
  rangeDays: DashboardRange;
  recentBets: DashboardRecentBet[];
  settlementBreakdown: DashboardBreakdown[];
  strategyBreakdown: DashboardBreakdown[];
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
  executed_live: boolean | null;
  edge_vs_gmean: number | string | null;
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
  last_attempted_at: string | null;
  loss_flag: number | boolean | null;
  outcome_label: string | null;
  pending_flag: number | boolean | null;
  pm_team_1: string | null;
  pm_team_2: string | null;
  refreshed_at: string | null;
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

type DashboardSummary = {
  actualLivePnlSum: number | null;
  livePlacedCount: number;
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
  return row.collected_at_poly ?? row.collected_at_event ?? row.refreshed_at;
}

function getLiveBetTimestamp(row: StrategyBetPerformanceRow) {
  return (
    row.settled_at ??
    row.first_successful_attempted_at ??
    row.last_attempted_at ??
    row.refreshed_at
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

function getSummary(rows: StrategyBetPerformanceRow[]): DashboardSummary {
  const signalRows = rows.filter(isSignal);
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
  const actualLivePnlValues = signalRows
    .filter((row) => row.live_bet_placed === true)
    .map(getActualLivePnlValue)
    .filter((value): value is number => value !== null);
  const totalStake = signalRows.reduce(
    (total, row) => total + (toNullableNumber(row.theoretical_stake_usdc) ?? 0),
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
    livePlacedCount: signalRows.reduce(
      (total, row) => total + (row.live_bet_placed === true ? toNullableNumber(row.signal_count) ?? 1 : 0),
      0,
    ),
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

function getStrategyLimit(rangeDays: DashboardRange) {
  if (rangeDays === 7) {
    return 1800;
  }

  if (rangeDays === 30) {
    return 4200;
  }

  return 7200;
}

function buildSamplingNotice(loadedCount: number, totalCount: number | null) {
  if (totalCount !== null && totalCount > loadedCount) {
    return `Live performance is based on the most recent ${loadedCount.toLocaleString("en-US")} rows out of about ${totalCount.toLocaleString("en-US")} in strategy_bet_performance.`;
  }

  return "Live performance is loaded directly from strategy_bet_performance through Supabase REST.";
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
      label: "Strategy PnL",
      type: "currency",
      value: current.realizedPnlSum ?? 0,
    });
  } else {
    metrics.push({
      change: relativeDelta(current.livePlacedCount, previous.livePlacedCount),
      changeKind: "relative",
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

function buildSettlementBreakdown(rows: StrategyBetPerformanceRow[]) {
  const signalRows = rows.filter(isSignal);
  const groups = new Map<string, number>();

  for (const row of signalRows) {
    const key = (row.settlement_status ?? "unknown").toLowerCase();
    groups.set(key, (groups.get(key) ?? 0) + (toNullableNumber(row.signal_count) ?? 0));
  }

  return Array.from(groups.entries())
    .map(([label, value]) => ({
      helper: `${((value / Math.max(signalRows.length, 1)) * 100).toFixed(1)}%`,
      label: label.replaceAll("_", " "),
      tone:
        label === "won"
          ? "positive"
          : label === "lost"
            ? "negative"
            : "neutral",
      value,
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6) as DashboardBreakdown[];
}

function buildStrategyBreakdown(rows: StrategyBetPerformanceRow[]) {
  const signalRows = rows.filter(isSignal);
  const groups = new Map<
    string,
    { count: number; losses: number; pnl: number; pnlCount: number; stake: number; wins: number }
  >();

  for (const row of signalRows) {
    const key = row.strategy_name ?? "unknown";
    const current = groups.get(key) ?? {
      count: 0,
      losses: 0,
      pnl: 0,
      pnlCount: 0,
      stake: 0,
      wins: 0,
    };
    const signalCount = toNullableNumber(row.signal_count) ?? 0;
    const pnl = toNullableNumber(row.theoretical_pnl_usdc);

    current.count += signalCount;
    current.wins += toBoolean(row.win_flag) ? signalCount : 0;
    current.losses += toBoolean(row.loss_flag) ? signalCount : 0;
    current.stake += toNullableNumber(row.theoretical_stake_usdc) ?? 0;
    if (pnl !== null) {
      current.pnl += pnl;
      current.pnlCount += 1;
    }
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([label, value]) => {
      const denominator = value.wins + value.losses;
      const roi = value.stake === 0 ? null : (value.pnl / value.stake) * 100;
      const helper =
        roi !== null && value.pnlCount > 0
          ? `${roi.toFixed(1)}% roi`
          : denominator === 0
            ? `${value.count} signals`
            : `${((value.wins / denominator) * 100).toFixed(1)}% win`;

      return {
        helper,
        label,
        tone:
          roi !== null
            ? roi > 0
              ? "positive"
              : roi < 0
                ? "negative"
                : "neutral"
            : value.wins > value.losses
              ? "positive"
              : "neutral",
        value: value.count,
      };
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 6) as DashboardBreakdown[];
}

function buildRecentBets(rows: StrategyBetPerformanceRow[]) {
  return rows
    .filter((row) => row.live_bet_attempted === true || row.live_bet_placed === true)
    .sort((left, right) => {
      return (
        new Date(getLiveBetTimestamp(right) ?? 0).getTime() -
        new Date(getLiveBetTimestamp(left) ?? 0).getTime()
      );
    })
    .slice(0, 8)
    .map((row) => ({
      amount: getStakeValue(row),
      id: row.fact_key,
      outcome: row.outcome_label ?? "Unknown outcome",
      pnl: getActualLivePnlValue(row),
      status:
        (
        row.live_bet_settled
          ? row.live_bet_result_status
          : row.live_bet_placed
            ? row.live_bet_placement_status ?? "placed"
            : row.live_bet_attempted
              ? row.live_bet_placement_status ?? "attempted"
              : "unknown"
        )?.toLowerCase().replaceAll("_", " ") ?? "unknown",
      strategy: row.strategy_name ?? "unknown",
      teamOne: row.pm_team_1 ?? "Unknown",
      teamTwo: row.pm_team_2 ?? "Unknown",
      updatedAt: getLiveBetTimestamp(row),
    }));
}

function buildDemoData(rangeDays: DashboardRange, notice: string): DashboardData {
  return {
    generatedAt: new Date().toISOString(),
    loadedCount: 3200,
    metrics: [
      {
        change: 9.4,
        changeKind: "relative",
        helper: `vs previous ${rangeDays} days`,
        id: "signal-count",
        label: "Signals",
        type: "compact",
        value: 126,
      },
      {
        change: 4.6,
        changeKind: "points",
        helper: `vs previous ${rangeDays} days`,
        id: "settled-win-rate",
        label: "Settled win rate",
        type: "points",
        value: 58.4,
      },
      {
        change: 3.1,
        changeKind: "points",
        helper: `vs previous ${rangeDays} days`,
        id: "portfolio-roi",
        label: "Portfolio ROI",
        type: "points",
        value: 12.4,
      },
      {
        change: 7.8,
        changeKind: "relative",
        helper: `vs previous ${rangeDays} days`,
        id: "realized-pnl",
        label: "Strategy PnL",
        type: "currency",
        value: 214,
      },
    ],
    mode: "demo",
    notice,
    rangeDays,
    recentBets: [
      {
        amount: 12,
        id: "demo-1",
        outcome: "FC Barcelona",
        pnl: 5.4,
        status: "won",
        strategy: "bet_12",
        teamOne: "Atletico",
        teamTwo: "Barcelona",
        updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        amount: 8,
        id: "demo-2",
        outcome: "Mavericks",
        pnl: 3.2,
        status: "won",
        strategy: "bet_06",
        teamOne: "Warriors",
        teamTwo: "Mavericks",
        updatedAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      },
      {
        amount: 10,
        id: "demo-3",
        outcome: "Pelicans",
        pnl: -10,
        status: "lost",
        strategy: "bet_06",
        teamOne: "Pelicans",
        teamTwo: "Knicks",
        updatedAt: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
      },
      {
        amount: 6,
        id: "demo-4",
        outcome: "Heat",
        pnl: null,
        status: "pending",
        strategy: "bet_19",
        teamOne: "Heat",
        teamTwo: "Cavaliers",
        updatedAt: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
      },
    ],
    settlementBreakdown: [
      { helper: "58.4%", label: "won", tone: "positive", value: 45 },
      { helper: "31.2%", label: "lost", tone: "negative", value: 24 },
      { helper: "10.4%", label: "pending", tone: "neutral", value: 8 },
    ],
    strategyBreakdown: [
      { helper: "61.0% win", label: "bet_06", tone: "positive", value: 44 },
      { helper: "57.1% win", label: "bet_12", tone: "positive", value: 28 },
      { helper: "50.0% win", label: "bet_15", tone: "neutral", value: 20 },
      { helper: "40.0% win", label: "bet_19", tone: "neutral", value: 15 },
    ],
    totalCount: 18192,
    updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  };
}

export function getRangeFromSearch(value: string | string[] | undefined) {
  return clampRange(value);
}

export async function getDashboardData(rangeDays: DashboardRange): Promise<DashboardData> {
  if (!hasSupabaseConfig()) {
    return buildDemoData(
      rangeDays,
      "No Supabase REST credentials were found. The UI is running on a demo snapshot until the API values are configured.",
    );
  }

  const now = new Date();
  const comparisonStart = subtractDays(now, rangeDays * 2).toISOString();
  const currentStart = subtractDays(now, rangeDays).toISOString();
  const limit = getStrategyLimit(rangeDays);

  try {
    const page = await fetchSupabaseSlice<StrategyBetPerformanceRow>(
      "strategy_bet_performance",
      {
        countMode: "planned",
        limit,
        query: {
          order: "collected_at_poly.desc.nullslast,collected_at_event.desc.nullslast,refreshed_at.desc",
          or: `(collected_at_poly.gte.${comparisonStart},collected_at_event.gte.${comparisonStart},refreshed_at.gte.${comparisonStart})`,
          select:
            "fact_key,refreshed_at,collected_at_poly,collected_at_event,settled_at,last_attempted_at,first_successful_attempted_at,strategy_name,strategy_threshold,sport,competition,is_bet_signal,signal_count,executed_live,live_bet_attempted,live_bet_placed,live_bet_placement_status,live_bet_result_status,live_bet_settled,live_bet_won_flag,live_bet_lost_flag,live_bet_push_flag,live_bet_pending_flag,settlement_status,outcome_label,pm_team_1,pm_team_2,actual_amount_usdc,actual_cost_usdc,actual_realized_pnl_usdc,actual_realized_pnl_estimated_usdc,actual_realized_roi,actual_realized_roi_estimated,theoretical_stake_usdc,theoretical_pnl_usdc,theoretical_roi,edge_vs_gmean,win_flag,loss_flag,pending_flag",
        },
      },
    );

    const rows = page.data;
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
    const updatedAt = rows.reduce<string | null>((latest, row) => {
      const timestamp = row.refreshed_at ?? getWindowTimestamp(row);
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
      loadedCount: rows.length,
      metrics: buildMetrics(rangeDays, currentRows, previousRows),
      mode: "live",
      notice: `${buildSamplingNotice(rows.length, page.count)} Snapshot windows use collected_at_poly/collected_at_event, and rows older than 7 days may not be re-evaluated by the sync job.`,
      rangeDays,
      recentBets: buildRecentBets(currentRows),
      settlementBreakdown: buildSettlementBreakdown(currentRows),
      strategyBreakdown: buildStrategyBreakdown(currentRows),
      totalCount: page.count,
      updatedAt,
    };
  } catch (error) {
    console.error("Failed to load dashboard data from strategy_bet_performance", error);

    return buildDemoData(
      rangeDays,
      "The live performance query failed, so the dashboard fell back to demo data. Check table permissions and the API key if this persists.",
    );
  }
}
