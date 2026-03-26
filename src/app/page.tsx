import { cookies } from "next/headers";
import { connection } from "next/server";

import { UnlockGate } from "@/components/auth/unlock-gate";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard";
import {
  DASHBOARD_RANGE_COOKIE,
  parseDashboardRange,
} from "@/lib/dashboard-range";
import {
  DASHBOARD_UNLOCK_COOKIE,
  DASHBOARD_UNLOCK_TOKEN,
} from "@/lib/site-lock";

export default async function Home() {
  await connection();

  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(DASHBOARD_UNLOCK_COOKIE)?.value === DASHBOARD_UNLOCK_TOKEN;

  if (!unlocked) {
    return <UnlockGate />;
  }

  const range = parseDashboardRange(cookieStore.get(DASHBOARD_RANGE_COOKIE)?.value);
  const data = await getDashboardData(range);

  return <DashboardView data={data} />;
}
