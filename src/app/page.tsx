import { cookies } from "next/headers";
import { connection } from "next/server";

import { UnlockGate } from "@/components/auth/unlock-gate";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData, getRangeFromSearch } from "@/lib/dashboard";
import {
  DASHBOARD_UNLOCK_COOKIE,
  DASHBOARD_UNLOCK_TOKEN,
} from "@/lib/site-lock";

type HomePageProps = {
  searchParams: Promise<{
    range?: string | string[] | undefined;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  await connection();

  const cookieStore = await cookies();
  const unlocked =
    cookieStore.get(DASHBOARD_UNLOCK_COOKIE)?.value === DASHBOARD_UNLOCK_TOKEN;

  if (!unlocked) {
    return <UnlockGate />;
  }

  const params = await searchParams;
  const range = getRangeFromSearch(params.range);
  const data = await getDashboardData(range);

  return <DashboardView data={data} />;
}
