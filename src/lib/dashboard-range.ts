export const dashboardRanges = [7, 30, 90] as const;

export type DashboardRange = (typeof dashboardRanges)[number];

export const DASHBOARD_RANGE_COOKIE = "polygon_view_range_days";
export const DASHBOARD_RANGE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseDashboardRange(value: string | string[] | undefined): DashboardRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number(candidate);

  if (dashboardRanges.includes(parsed as DashboardRange)) {
    return parsed as DashboardRange;
  }

  return 30;
}
