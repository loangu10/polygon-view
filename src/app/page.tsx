import { connection } from "next/server";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData, getRangeFromSearch } from "@/lib/dashboard";

type HomePageProps = {
  searchParams: Promise<{
    range?: string | string[] | undefined;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  await connection();

  const params = await searchParams;
  const range = getRangeFromSearch(params.range);
  const data = await getDashboardData(range);

  return <DashboardView data={data} />;
}
