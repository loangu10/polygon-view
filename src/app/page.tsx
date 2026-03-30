import { Suspense } from "react";

import { cookies } from "next/headers";

import { UnlockGate } from "@/components/auth/unlock-gate";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
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

async function DashboardContent({
  range,
}: {
  range: ReturnType<typeof parseDashboardRange>;
}) {
  const data = await getDashboardData(range);

  return <DashboardView data={data} />;
}

export default async function Home() {
  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(DASHBOARD_UNLOCK_COOKIE)?.value === DASHBOARD_UNLOCK_TOKEN;

  if (!unlocked) {
    return <UnlockGate />;
  }

  const range = parseDashboardRange(cookieStore.get(DASHBOARD_RANGE_COOKIE)?.value);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent range={range} />
    </Suspense>
  );
}
